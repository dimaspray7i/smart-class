<?php

namespace App\Services;

use App\Models\Subject;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class SubjectService
{
    /**
     * Get subjects with filters (paginated or all)
     * 
     * @param array $filters
     * @return mixed
     */
    public function all(array $filters = []): mixed
    {
        $query = Subject::query();

        // Filter by category (productive, normative, adaptive)
        if (!empty($filters['category']) && in_array($filters['category'], ['productive', 'normative', 'adaptive'])) {
            $query->where('category', $filters['category']);
        }

        // Filter by is_active status
        if (isset($filters['is_active'])) {
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
        if (!empty($filters['sort'])) {
            switch ($filters['sort']) {
                case 'name':
                    $query->orderBy('name', 'asc');
                    break;
                case 'code':
                    $query->orderBy('code', 'asc');
                    break;
                case 'credits':
                    $query->orderBy('credits', 'desc');
                    break;
                case 'created_at':
                    $query->orderBy('created_at', 'desc');
                    break;
                default:
                    $query->orderBy('category')->orderBy('code');
            }
        } else {
            // Default sorting: by category then by code
            $query->orderBy('category')->orderBy('code');
        }

        // Check if we need all records without pagination
        if (!empty($filters['all'])) {
            return $query->withCount(['schedules', 'classes'])->get();
        }

        // Add counts for frontend stats display
        return $query->withCount(['schedules', 'classes'])->paginate(15);
    }

    /**
     * Find subject by ID with relationships
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
     * Create new subject
     * 
     * @param array $data
     * @return array
     */
    public function create(array $data): array
    {
        try {
            DB::beginTransaction();

            // Check if code already exists
            if (Subject::where('code', $data['code'])->exists()) {
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
                'code' => strtoupper($data['code']),
                'name' => $data['name'],
                'category' => $data['category'],
                'credits' => $data['credits'] ?? 4,
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ];

            // Create subject
            $subject = Subject::create($subjectData);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Mapel berhasil dibuat.',
                'code' => 'CREATE_SUCCESS',
                'subject' => $subject->fresh(),
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
            Log::error('SubjectService::create failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'data' => config('app.debug') ? $data : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat mapel: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Update existing subject
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
            if (isset($data['code']) && strtoupper($data['code']) !== $subject->code) {
                if (Subject::where('code', strtoupper($data['code']))->where('id', '!=', $id)->exists()) {
                    DB::rollBack();
                    return [
                        'success' => false,
                        'message' => 'Kode mapel sudah digunakan.',
                        'code' => 'CODE_EXISTS',
                        'errors' => ['code' => ['Kode mapel sudah terdaftar.']],
                    ];
                }
            }

            // Prepare update data
            $updateData = [];
            
            if (isset($data['code'])) {
                $updateData['code'] = strtoupper($data['code']);
            }
            if (isset($data['name'])) {
                $updateData['name'] = $data['name'];
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

            // Update subject
            $subject->update($updateData);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Mapel berhasil diupdate.',
                'code' => 'UPDATE_SUCCESS',
                'subject' => $subject->fresh(),
            ];

        } catch (Exception $e) {
            DB::rollBack();
            
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
        }
    }

    /**
     * Delete subject (soft delete)
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

            // Check if subject has active schedules
            $hasActiveSchedules = $subject->schedules()
                ->where('is_active', true)
                ->exists();
            
            if ($hasActiveSchedules) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Tidak dapat menghapus mapel yang masih memiliki jadwal aktif.',
                    'code' => 'HAS_ACTIVE_SCHEDULES',
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
     * Get subject statistics
     * 
     * @return array
     */
    public function getStatistics(): array
    {
        try {
            $total = Subject::count();
            $active = Subject::where('is_active', true)->count();
            $productive = Subject::where('category', 'productive')->count();
            $normative = Subject::where('category', 'normative')->count();
            $adaptive = Subject::where('category', 'adaptive')->count();
            $avgCredits = Subject::avg('credits') ?? 0;

            return [
                'success' => true,
                'data' => [
                    'total' => $total,
                    'active' => $active,
                    'inactive' => $total - $active,
                    'by_category' => [
                        'productive' => $productive,
                        'normative' => $normative,
                        'adaptive' => $adaptive,
                    ],
                    'average_credits' => round($avgCredits, 2),
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
     * Get subjects for dropdown/select options
     * 
     * @param array $filters
     * @return array
     */
    public function getOptions(array $filters = []): array
    {
        $query = Subject::query();

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        $subjects = $query->orderBy('name')->get(['id', 'code', 'name', 'category']);

        return $subjects->map(function ($subject) {
            return [
                'id' => $subject->id,
                'label' => "{$subject->code} - {$subject->name}",
                'value' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'category' => $subject->category,
            ];
        })->toArray();
    }
}