<?php

namespace App\Services;

use App\Models\ClassModel;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Exception;

class ClassService
{
    /**
     * Get paginated classes with filters
     */
    public function all(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = ClassModel::query();

        // Filter by level
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

        // Eager load relationships for table view
        return $query->withCount(['students' => function ($q) {
                $q->wherePivot('role_in_class', 'siswa')
                  ->wherePivot('is_active', true);
            }, 'subjects'])
            ->with([
                'teachers' => function ($q) {
                    $q->wherePivot('role_in_class', '!=', 'siswa')
                      ->wherePivot('is_active', true)
                      ->limit(3)
                      ->select('users.id', 'users.name', 'users.email');
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
     * Find class by ID with full relationships
     */
    public function find(int $id): ?ClassModel
    {
        return ClassModel::with([
            'students' => function ($q) {
                $q->wherePivot('role_in_class', 'siswa')
                  ->wherePivot('is_active', true)
                  ->select('users.id', 'users.name', 'users.email', 'users.avatar_url');
            },
            'teachers' => function ($q) {
                $q->wherePivot('role_in_class', '!=', 'siswa')
                  ->wherePivot('is_active', true)
                  ->select('users.id', 'users.name', 'users.email');
            },
            'waliKelasRelation' => function ($q) {
                $q->wherePivot('role_in_class', 'wali_kelas')
                  ->select('users.id', 'users.name');
            },
            'subjects' => function ($q) {
                $q->select('subjects.id', 'subjects.name', 'subjects.code');
            },
            'schedules' => function ($q) {
                $q->with(['subject', 'teacher'])
                  ->orderBy('day')
                  ->orderBy('start_time')
                  ->limit(5);
            }
        ])->find($id);
    }

    /**
     * Create new class with teacher/subject assignment
     */
    public function create(array $data): array
    {
        try {
            DB::beginTransaction();

            // Create class
            $class = ClassModel::create([
                'name' => $data['name'],
                'level' => $data['level'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'capacity' => $data['capacity'] ?? 36,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Assign teachers if provided (first = wali_kelas, rest = guru_pengampu)
            if (!empty($data['teacher_ids']) && is_array($data['teacher_ids'])) {
                foreach ($data['teacher_ids'] as $index => $teacherId) {
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

            // Assign subjects if provided (requires class_subjects pivot table)
            if (!empty($data['subject_ids']) && is_array($data['subject_ids'])) {
                // Check if pivot table exists before attaching
                if (DB::getSchemaBuilder()->hasTable('class_subject')) {
                    $class->subjects()->attach($data['subject_ids']);
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Kelas berhasil dibuat.',
                'class' => $this->find($class->id), // Return with relationships
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

            // Update class basic info
            $class->update([
                'name' => $data['name'] ?? $class->name,
                'level' => $data['level'] ?? $class->level,
                'slug' => Str::slug($data['name'] ?? $class->name),
                'description' => $data['description'] ?? $class->description,
                'capacity' => $data['capacity'] ?? $class->capacity,
                'is_active' => $data['is_active'] ?? $class->is_active,
            ]);

            // Update teachers assignment if provided
            if (isset($data['teacher_ids']) && is_array($data['teacher_ids'])) {
                // Detach all existing teachers (non-student roles)
                $class->users()->wherePivot('role_in_class', '!=', 'siswa')->detach();
                
                // Re-attach new teachers
                foreach ($data['teacher_ids'] as $index => $teacherId) {
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

            // Update subjects if provided
            if (isset($data['subject_ids']) && is_array($data['subject_ids'])) {
                if (DB::getSchemaBuilder()->hasTable('class_subject')) {
                    $class->subjects()->sync($data['subject_ids']);
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Kelas berhasil diupdate.',
                'class' => $this->find($class->id), // Return with relationships
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

            // Optional: Also check for active schedules
            $scheduleCount = $class->schedules()->where('is_active', true)->count();
            if ($scheduleCount > 0) {
                return [
                    'success' => false,
                    'message' => "Tidak dapat menghapus kelas yang masih memiliki {$scheduleCount} jadwal aktif.",
                    'code' => 'CLASS_HAS_SCHEDULES',
                ];
            }

            $class->delete();

            return [
                'success' => true,
                'message' => 'Kelas berhasil dihapus.',
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
     * Get class statistics for dashboard
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
        ];
    }

    /**
     * Export classes to CSV format
     */
    public function export(array $filters = []): array
    {
        $query = ClassModel::query();

        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }
        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }
        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        $classes = $query->withCount(['students' => function ($q) {
                $q->wherePivot('role_in_class', 'siswa');
            }])
            ->with(['waliKelasRelation'])
            ->orderBy('level')
            ->orderBy('name')
            ->get();

        return $classes->map(function ($class) {
            return [
                'ID' => $class->id,
                'Nama Kelas' => $class->name,
                'Level' => "Kelas {$class->level}",
                'Deskripsi' => $class->description,
                'Kapasitas' => $class->capacity,
                'Jumlah Siswa' => $class->students_count,
                'Wali Kelas' => $class->wali_kelas->name ?? '-',
                'Status' => $class->is_active ? 'Aktif' : 'Non-Aktif',
                'Dibuat' => $class->created_at?->format('Y-m-d'),
            ];
        })->toArray();
    }
}