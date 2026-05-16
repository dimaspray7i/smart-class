<?php

namespace App\Services;

use App\Models\Subject;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;
use Exception;

class SubjectService
{
    /**
     * Get subjects with filters (paginated or all)
     * 
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator|\Illuminate\Database\Eloquent\Collection
     */
    public function all(array $filters = []): mixed
    {
        $query = Subject::query();

        // Filter by category (productive, normative, adaptive)
        if (!empty($filters['category']) && in_array($filters['category'], ['productive', 'normative', 'adaptive'])) {
            $query->where('category', $filters['category']);
        }

        // Filter by is_active status
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Filter by search term (name or code)
        if (!empty($filters['search'])) {
            $searchTerm = $filters['search'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('code', 'like', "%{$searchTerm}%");
            });
        }

        // Filter by credits range
        if (!empty($filters['credits_min'])) {
            $query->where('credits', '>=', (int) $filters['credits_min']);
        }
        if (!empty($filters['credits_max'])) {
            $query->where('credits', '<=', (int) $filters['credits_max']);
        }

        // Sorting options
        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['sort_direction'] ?? 'asc';
        
        $validSorts = ['name', 'code', 'credits', 'created_at', 'updated_at'];
        if (in_array($sort, $validSorts)) {
            $query->orderBy($sort, $direction);
        } else {
            // Default: by category then by code
            $query->orderBy('category')->orderBy('code');
        }

        // Check if we need all records without pagination
        if (!empty($filters['all'])) {
            return $query->withCount(['schedules', 'classes'])->get();
        }

        // Paginate with counts for frontend stats
        $perPage = min((int) ($filters['per_page'] ?? 15), 100); // Max 100 per page
        
        return $query
            ->withCount(['schedules', 'classes'])
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Find subject by ID with relationships and counts
     * 
     * @param int $id
     * @return Subject|null
     */
    public function find(int $id): ?Subject
    {
        return Subject::withCount(['schedules', 'classes'])
            ->with(['profiles.user' => function ($query) {
                $query->select('id', 'name', 'email');
            }])
            ->find($id);
    }

    /**
     * Create new subject with validation and transaction
     * 
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        try {
            DB::beginTransaction();

            // Check if code already exists (case-insensitive)
            $code = strtoupper(trim($data['code']));
            if (Subject::whereRaw('UPPER(code) = ?', [$code])->exists()) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Kode mapel sudah digunakan.',
                    'code' => 'CODE_EXISTS',
                    'errors' => ['code' => ['Kode mapel sudah terdaftar.']],
                ];
            }

            // Prepare data for creation
            $subjectData = [
                'code' => $code,
                'name' => trim($data['name']),
                'category' => $data['category'],
                'credits' => (int) ($data['credits'] ?? 4),
                'description' => $data['description'] ?? null,
                'is_active' => filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];

            // Create subject
            $subject = Subject::create($subjectData);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Mapel berhasil dibuat.',
                'code' => 'CREATE_SUCCESS',
                'subject' => $subject->fresh()->loadCount(['schedules', 'classes']),
            ];

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            
            // Handle duplicate entry specifically
            if ($e->errorInfo[1] ?? 0 == 1062) {
                return [
                    'success' => false,
                    'message' => 'Kode mapel sudah digunakan.',
                    'code' => 'CODE_EXISTS',
                    'errors' => ['code' => ['Kode mapel sudah terdaftar.']],
                ];
            }
            
            Log::error('SubjectService::create failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'data' => config('app.debug') ? array_diff_key($data, ['password' => 1]) : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat mapel: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('SubjectService::create exception', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return [
                'success' => false,
                'message' => 'Terjadi kesalahan saat membuat mapel.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Update existing subject with validation and transaction
     * 
     * @param int $id
     * @param array $data
     * @return array
     */
    public function update(int $id, array $data): array
    {
        try {
            DB::beginTransaction();

            $subject = Subject::find($id);
            
            if (!$subject) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Mapel tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            // Check if code is being changed and already exists
            if (isset($data['code'])) {
                $newCode = strtoupper(trim($data['code']));
                if ($newCode !== $subject->code) {
                    if (Subject::whereRaw('UPPER(code) = ?', [$newCode])
                        ->where('id', '!=', $id)
                        ->exists()) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'message' => 'Kode mapel sudah digunakan.',
                            'code' => 'CODE_EXISTS',
                            'errors' => ['code' => ['Kode mapel sudah terdaftar.']],
                        ];
                    }
                }
            }

            // Prepare update data (only update provided fields)
            $updateData = [];
            
            if (isset($data['code'])) {
                $updateData['code'] = strtoupper(trim($data['code']));
            }
            if (isset($data['name'])) {
                $updateData['name'] = trim($data['name']);
            }
            if (isset($data['category'])) {
                $updateData['category'] = $data['category'];
            }
            if (isset($data['credits'])) {
                $updateData['credits'] = (int) $data['credits'];
            }
            if (isset($data['description'])) {
                $updateData['description'] = $data['description'];
            }
            if (isset($data['is_active'])) {
                $updateData['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
            }

            // Only update if there are changes
            if (!empty($updateData)) {
                $subject->update($updateData);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Mapel berhasil diupdate.',
                'code' => 'UPDATE_SUCCESS',
                'subject' => $subject->fresh()->loadCount(['schedules', 'classes']),
            ];

        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            
            if (($e->errorInfo[1] ?? 0) == 1062) {
                return [
                    'success' => false,
                    'message' => 'Kode mapel sudah digunakan.',
                    'code' => 'CODE_EXISTS',
                    'errors' => ['code' => ['Kode mapel sudah terdaftar.']],
                ];
            }
            
            Log::error('SubjectService::update failed', [
                'subject_id' => $id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update mapel: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('SubjectService::update exception', [
                'subject_id' => $id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return [
                'success' => false,
                'message' => 'Terjadi kesalahan saat update mapel.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Delete subject with safety checks (soft delete)
     * 
     * @param int $id
     * @return array
     */
    public function delete(int $id): array
    {
        try {
            DB::beginTransaction();

            $subject = Subject::find($id);
            
            if (!$subject) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Mapel tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            // Safety check: Cannot delete if has active schedules
            $hasActiveSchedules = $subject->schedules()
                ->where('is_active', true)
                ->exists();
            
            if ($hasActiveSchedules) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Tidak dapat menghapus mapel yang masih memiliki jadwal aktif.',
                    'code' => 'HAS_ACTIVE_SCHEDULES',
                    'hint' => 'Non-aktifkan atau hapus jadwal terlebih dahulu.',
                ];
            }

            // Safety check: Cannot delete if assigned to classes
            $hasClassAssignments = $subject->classes()->exists();
            
            if ($hasClassAssignments) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Tidak dapat menghapus mapel yang masih terhubung dengan kelas.',
                    'code' => 'ASSIGNED_TO_CLASSES',
                    'hint' => 'Lepaskan mapel dari kelas terlebih dahulu.',
                ];
            }

            // Perform soft delete
            $subject->delete();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Mapel berhasil dihapus.',
                'code' => 'DELETE_SUCCESS',
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('SubjectService::delete failed', [
                'subject_id' => $id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghapus mapel: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Get subject statistics for dashboard
     * 
     * @return array
     */
    public function getStatistics(): array
    {
        try {
            $total = Subject::count();
            $active = Subject::where('is_active', true)->count();
            
            $byCategory = Subject::selectRaw('category, count(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray();

            return [
                'success' => true,
                'data' => [
                    'total' => $total,
                    'active' => $active,
                    'inactive' => $total - $active,
                    'by_category' => [
                        'productive' => $byCategory['productive'] ?? 0,
                        'normative' => $byCategory['normative'] ?? 0,
                        'adaptive' => $byCategory['adaptive'] ?? 0,
                    ],
                    'average_credits' => round(Subject::avg('credits') ?? 0, 2),
                ],
            ];

        } catch (Exception $e) {
            Log::error('SubjectService::getStatistics failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal mengambil statistik.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get subjects for dropdown/select options (lightweight)
     * 
     * @param array $filters
     * @return array
     */
    public function getOptions(array $filters = []): array
    {
        $query = Subject::query()->select('id', 'code', 'name', 'category', 'is_active');

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        $subjects = $query->orderBy('name')->get();

        return $subjects->map(function ($subject) {
            return [
                'id' => $subject->id,
                'label' => "{$subject->code} - {$subject->name}",
                'value' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'category' => $subject->category,
                'category_label' => $subject->category_label,
                'is_active' => $subject->is_active,
            ];
        })->toArray();
    }

    /**
     * Get subjects for grid view with retro metadata
     * 
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getForGridView(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = Subject::query();

        // Apply filters
        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }
        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        $perPage = min((int) ($filters['per_page'] ?? 12), 100);

        return $query
            ->withCount(['schedules', 'classes'])
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }
}