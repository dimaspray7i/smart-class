<?php

namespace App\Services;

use App\Models\ClassModel;
use App\Models\User;
use App\Models\Subject;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Exception;

class ClassService
{
    /**
     * Get paginated classes with filters (Retro-compatible response)
     * 
     * @param array $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function all(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = ClassModel::query();

        // Filter by level (X, XI, XII)
        if (!empty($filters['level']) && in_array($filters['level'], ['X', 'XI', 'XII'])) {
            $query->where('level', $filters['level']);
        }

        // Filter by is_active (handle boolean/string properly)
        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Search by name or description
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        // Eager load relationships for table view (optimized for retro frontend)
        return $query->withCount([
                'students' => function ($q) {
                    $q->wherePivot('role_in_class', 'siswa')
                      ->wherePivot('is_active', true);
                },
                'subjects'
            ])
            ->with([
                'teachers' => function ($q) {
                    $q->wherePivot('role_in_class', '!=', 'siswa')
                      ->wherePivot('is_active', true)
                      ->limit(3)
                      ->select('users.id', 'users.name', 'users.email', 'users.avatar_url');
                },
                'waliKelasRelation' => function ($q) {
                    $q->wherePivot('role_in_class', 'wali_kelas')
                      ->select('users.id', 'users.name');
                }
            ])
            ->orderBy('level')
            ->orderBy('name')
            ->paginate(15);
    }

    /**
     * Get all classes for export/dropdown (no pagination)
     */
    public function getAllForExport(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = ClassModel::query();

        if (!empty($filters['level']) && in_array($filters['level'], ['X', 'XI', 'XII'])) {
            $query->where('level', $filters['level']);
        }
        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }
        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        return $query->withCount(['students' => function ($q) {
                $q->wherePivot('role_in_class', 'siswa');
            }])
            ->with(['waliKelasRelation'])
            ->orderBy('level')
            ->orderBy('name')
            ->get();
    }

    /**
     * Find class by ID with full relationships (Retro-compatible)
     */
    public function find(int $id): ?ClassModel
    {
        return ClassModel::with([
            'students' => function ($q) {
                $q->wherePivot('role_in_class', 'siswa')
                  ->wherePivot('is_active', true)
                  ->select('users.id', 'users.name', 'users.email', 'users.avatar_url', 'users.role');
            },
            'teachers' => function ($q) {
                $q->wherePivot('role_in_class', '!=', 'siswa')
                  ->wherePivot('is_active', true)
                  ->select('users.id', 'users.name', 'users.email', 'users.avatar_url', 'users.role')
                  ->withPivot('role_in_class');
            },
            'waliKelasRelation' => function ($q) {
                $q->wherePivot('role_in_class', 'wali_kelas')
                  ->select('users.id', 'users.name');
            },
            'subjects' => function ($q) {
                $q->select('subjects.id', 'subjects.name', 'subjects.code', 'subjects.category');
            },
            'schedules' => function ($q) {
                $q->with(['subject' => fn($sq) => $sq->select('id', 'name', 'code'), 
                          'teacher' => fn($tq) => $tq->select('id', 'name')])
                  ->orderBy('day')
                  ->orderBy('start_time')
                  ->limit(5);
            }
        ])->find($id);
    }

    /**
     * Create new class with teacher/subject assignment (Retro-compatible)
     */
    public function create(array $data): array
    {
        try {
            DB::beginTransaction();

            // Validate capacity
            $capacity = !empty($data['capacity']) ? (int) $data['capacity'] : 36;
            if ($capacity < 1 || $capacity > 100) {
                throw new Exception('Capacity must be between 1 and 100');
            }

            // Create class
            $class = ClassModel::create([
                'name' => trim($data['name']),
                'level' => $data['level'],
                'slug' => Str::slug($data['name']),
                'description' => !empty($data['description']) ? trim($data['description']) : null,
                'capacity' => $capacity,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Assign teachers if provided (first = wali_kelas, rest = guru_pengampu)
            if (!empty($data['teacher_ids']) && is_array($data['teacher_ids'])) {
                $this->attachTeachers($class, $data['teacher_ids']);
            }

            // Assign subjects if provided (requires class_subject pivot table)
            if (!empty($data['subject_ids']) && is_array($data['subject_ids'])) {
                $this->attachSubjects($class, $data['subject_ids']);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Kelas berhasil dibuat.',
                'class' => $this->find($class->id),
                'code' => 'CREATE_SUCCESS',
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
            // Cleanup: delete class if transaction failed
            if (isset($class)) {
                $class->delete();
            }

            Log::error('ClassService::create failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'data' => array_keys($data),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'errors' => ['server' => [$e->getMessage()]],
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Update existing class with teacher/subject reassignment
     */
    public function update(int $id, array $data): array
    {
        try {
            $class = ClassModel::find($id);

            if (!$class) {
                return [
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            DB::beginTransaction();

            // Validate capacity if provided
            if (isset($data['capacity'])) {
                $capacity = (int) $data['capacity'];
                if ($capacity < 1 || $capacity > 100) {
                    throw new Exception('Capacity must be between 1 and 100');
                }
                $data['capacity'] = $capacity;
            }

            // Update class basic info
            $updateData = [
                'name' => $data['name'] ?? $class->name,
                'level' => $data['level'] ?? $class->level,
                'description' => $data['description'] ?? $class->description,
                'capacity' => $data['capacity'] ?? $class->capacity,
                'is_active' => $data['is_active'] ?? $class->is_active,
            ];
            
            // Regenerate slug if name changed
            if (isset($data['name']) && $data['name'] !== $class->name) {
                $updateData['slug'] = $this->generateUniqueSlug($data['name'], $id);
            }

            $class->update($updateData);

            // Update teachers assignment if provided
            if (isset($data['teacher_ids']) && is_array($data['teacher_ids'])) {
                $this->syncTeachers($class, $data['teacher_ids']);
            }

            // Update subjects if provided
            if (isset($data['subject_ids']) && is_array($data['subject_ids'])) {
                $this->syncSubjects($class, $data['subject_ids']);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Kelas berhasil diupdate.',
                'class' => $this->find($class->id),
                'code' => 'UPDATE_SUCCESS',
            ];

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('ClassService::update failed', [
                'class_id' => $id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'errors' => ['server' => [$e->getMessage()]],
            ];
        }
    }

    /**
     * Delete class (with safety checks)
     */
    public function delete(int $id): array
    {
        try {
            $class = ClassModel::find($id);

            if (!$class) {
                return [
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            // Safety check: prevent deleting class with active students
            $studentCount = $class->students()
                ->wherePivot('role_in_class', 'siswa')
                ->wherePivot('is_active', true)
                ->count();

            if ($studentCount > 0) {
                return [
                    'success' => false,
                    'message' => "Tidak dapat menghapus kelas yang masih memiliki {$studentCount} siswa aktif.",
                    'code' => 'CLASS_HAS_STUDENTS',
                ];
            }

            // Safety check: prevent deleting class with active schedules
            $scheduleCount = $class->schedules()->where('is_active', true)->count();
            if ($scheduleCount > 0) {
                return [
                    'success' => false,
                    'message' => "Tidak dapat menghapus kelas yang masih memiliki {$scheduleCount} jadwal aktif.",
                    'code' => 'CLASS_HAS_SCHEDULES',
                ];
            }

            // Soft delete or hard delete based on your needs
            $class->delete();

            return [
                'success' => true,
                'message' => 'Kelas berhasil dihapus.',
                'code' => 'DELETE_SUCCESS',
            ];

        } catch (Exception $e) {
            Log::error('ClassService::delete failed', [
                'class_id' => $id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghapus kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Delete multiple classes (bulk delete)
     */
    public function deleteMultiple(array $ids): array
    {
        try {
            DB::beginTransaction();

            $deleted = 0;
            $errors = [];

            foreach ($ids as $id) {
                $result = $this->delete($id);
                if ($result['success']) {
                    $deleted++;
                } else {
                    $errors[] = "ID {$id}: {$result['message']}";
                }
            }

            if ($deleted === 0) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Tidak ada kelas yang berhasil dihapus.',
                    'code' => 'BULK_DELETE_FAILED',
                    'errors' => $errors,
                ];
            }

            DB::commit();

            $message = $deleted === count($ids) 
                ? "{$deleted} kelas berhasil dihapus." 
                : "{$deleted} dari " . count($ids) . " kelas berhasil dihapus.";

            return [
                'success' => true,
                'message' => $message,
                'code' => 'BULK_DELETE_SUCCESS',
                'deleted' => $deleted,
                'errors' => !empty($errors) ? $errors : null,
            ];

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('ClassService::deleteMultiple failed', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'message' => 'Gagal menghapus kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get class statistics for dashboard (Retro-compatible format)
     */
    public function getStats(): array
    {
        return [
            'total' => ClassModel::where('is_active', true)->count(),
            'by_level' => [
                'X' => ClassModel::where('level', 'X')->where('is_active', true)->count(),
                'XI' => ClassModel::where('level', 'XI')->where('is_active', true)->count(),
                'XII' => ClassModel::where('level', 'XII')->where('is_active', true)->count(),
            ],
            'total_capacity' => ClassModel::where('is_active', true)->sum('capacity'),
            'avg_capacity' => round(ClassModel::where('is_active', true)->avg('capacity') ?? 0),
            'total_students' => DB::table('class_user')
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->count(),
        ];
    }

    /**
     * Export classes to CSV format (Retro-compatible)
     */
    public function export(array $filters = []): array
    {
        $classes = $this->getAllForExport($filters);

        return $classes->map(function ($class) {
            return [
                'ID' => $class->id,
                'Nama Kelas' => $class->name,
                'Level' => "Kelas {$class->level}",
                'Deskripsi' => $class->description ?? '-',
                'Kapasitas' => $class->capacity,
                'Jumlah Siswa' => $class->students_count ?? 0,
                'Wali Kelas' => $class->wali_kelas?->name ?? '-',
                'Status' => $class->is_active ? 'Aktif' : 'Non-Aktif',
                'Dibuat' => $class->created_at?->format('Y-m-d H:i:s'),
                'Diupdate' => $class->updated_at?->format('Y-m-d H:i:s'),
            ];
        })->toArray();
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS (Private)
    // ═══════════════════════════════════════════════════════════

    /**
     * Attach teachers to class with proper roles
     */
    private function attachTeachers(ClassModel $class, array $teacherIds): void
    {
        foreach ($teacherIds as $index => $teacherId) {
            $roleInClass = ($index === 0) ? 'wali_kelas' : 'guru_pengampu';
            
            $class->users()->attach($teacherId, [
                'role_in_class' => $roleInClass,
                'academic_year' => date('Y'),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Sync teachers to class (detach old, attach new)
     */
    private function syncTeachers(ClassModel $class, array $teacherIds): void
    {
        // Detach all existing teachers (non-student roles)
        $class->users()->wherePivot('role_in_class', '!=', 'siswa')->detach();
        
        // Re-attach new teachers
        $this->attachTeachers($class, $teacherIds);
    }

    /**
     * Attach subjects to class via pivot table
     */
    private function attachSubjects(ClassModel $class, array $subjectIds): void
    {
        if (!Schema::hasTable('class_subject')) {
            Log::warning('class_subject table not found, skipping subject attachment');
            return;
        }
        
        $class->subjects()->attach($subjectIds);
    }

    /**
     * Sync subjects to class via pivot table
     */
    private function syncSubjects(ClassModel $class, array $subjectIds): void
    {
        if (!Schema::hasTable('class_subject')) {
            Log::warning('class_subject table not found, skipping subject sync');
            return;
        }
        
        $class->subjects()->sync($subjectIds);
    }

    /**
     * Generate unique slug for class
     */
    private function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;
        
        $query = ClassModel::where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        while ($query->exists()) {
            $slug = $originalSlug . '-' . $counter++;
            $query = ClassModel::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
        }
        
        return $slug;
    }
}