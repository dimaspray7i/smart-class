<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ClassService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\ClassModel;
use App\Models\User;
use App\Models\Subject;
use Illuminate\Support\Facades\Log;

class ClassController extends Controller
{
    public function __construct(protected ClassService $classService)
    {
        //
    }

    /**
     * Get paginated classes with filters & relationships
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['level', 'is_active', 'search']);
        
        // Handle boolean conversion
        if (isset($filters['is_active'])) {
            $filters['is_active'] = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // Build query with relationships & counts
        $query = ClassModel::query()
            ->withCount(['students', 'subjects'])
            ->with([
                'teachers' => function($q) {
                    $q->select('users.id', 'users.name', 'users.email')
                      ->limit(5); // Limit for performance
                },
                'waliKelasRelation' => function($q) {
                    $q->select('users.id', 'users.name');
                },
                'subjects' => function($q) {
                    $q->select('subjects.id', 'subjects.name', 'subjects.code')
                      ->limit(10);
                }
            ]);

        // Apply filters
        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                  ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }
        
        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }
        
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        if ($request->has('all')) {
            $classes = $query->orderBy('level')->orderBy('name')->get();
            return response()->json([
                'status' => 'success',
                'message' => 'Semua kelas berhasil diambil.',
                'code' => 'CLASSES_SUCCESS',
                'data' => $classes,
            ], 200);
        }

        $classes = $query->orderBy('level')->orderBy('name')->paginate(15);

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil diambil.',
            'code' => 'CLASSES_SUCCESS',
            'data' => $classes->items(),
            'meta' => [
                'current_page' => $classes->currentPage(),
                'per_page' => $classes->perPage(),
                'total' => $classes->total(),
                'last_page' => $classes->lastPage(),
                'from' => $classes->firstItem(),
                'to' => $classes->lastItem(),
            ],
        ], 200);
    }

    /**
     * Get class detail with full relationships
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $class = ClassModel::with([
            'students' => function($q) { $q->limit(10); },
            'teachers',
            'waliKelasRelation',
            'subjects',
            'schedules' => function($q) { $q->limit(5); }
        ])->withCount(['students', 'subjects'])->find($id);

        if (!$class) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kelas tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil diambil.',
            'code' => 'CLASS_SUCCESS',
            'data' => $class,
        ], 200);
    }

    /**
     * Create new class with teachers & subjects assignment
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Validation with conditional rules
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:classes,name',
                'level' => 'required|in:X,XI,XII',
                'description' => 'nullable|string|max:1000',
                'capacity' => 'sometimes|integer|min:1|max:50',
                'is_active' => 'nullable|boolean',
                
                // Optional: Assign teachers (first = wali kelas)
                'teacher_ids' => 'nullable|array|min:1',
                'teacher_ids.*' => 'exists:users,id',
                
                // Optional: Assign subjects
                'subject_ids' => 'nullable|array',
                'subject_ids.*' => 'exists:subjects,id',
            ]);

            // Create class
            $class = ClassModel::create([
                'name' => $validated['name'],
                'level' => $validated['level'],
                'slug' => \Illuminate\Support\Str::slug($validated['name']),
                'description' => $validated['description'] ?? null,
                'capacity' => $validated['capacity'] ?? 36,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Assign teachers (if provided)
            if (!empty($validated['teacher_ids'])) {
                foreach ($validated['teacher_ids'] as $index => $teacherId) {
                    $roleInClass = $index === 0 ? 'wali_kelas' : 'guru_pengampu';
                    
                    $class->users()->attach($teacherId, [
                        'role_in_class' => $roleInClass,
                        'academic_year' => date('Y'),
                        'is_active' => true,
                    ]);
                }
            }

            // Assign subjects (if provided) - via class_subject pivot table
            if (!empty($validated['subject_ids'])) {
                // Sync subjects via class_subject pivot table
                $class->subjectsRelation()->sync($validated['subject_ids']);
            }

            DB::commit();

            // Load relationships for response
            $class->load(['teachers', 'waliKelasRelation', 'subjectsRelation']);

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil dibuat.',
                'code' => 'CREATE_SUCCESS',
                'data' => $class,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ClassController::store failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update class with teachers & subjects assignment
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $class = ClassModel::find($id);
            if (!$class) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Kelas tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ], 404);
            }

            // Validation
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255|unique:classes,name,' . $id,
                'level' => 'sometimes|in:X,XI,XII',
                'description' => 'nullable|string|max:1000',
                'capacity' => 'sometimes|integer|min:1|max:50',
                'is_active' => 'nullable|boolean',
                
                'teacher_ids' => 'nullable|array',
                'teacher_ids.*' => 'exists:users,id',
                
                'subject_ids' => 'nullable|array',
                'subject_ids.*' => 'exists:subjects,id',
            ]);

            // Update basic fields
            $updateData = [];
            if (isset($validated['name'])) $updateData['name'] = $validated['name'];
            if (isset($validated['level'])) $updateData['level'] = $validated['level'];
            if (isset($validated['description'])) $updateData['description'] = $validated['description'];
            if (isset($validated['capacity'])) $updateData['capacity'] = $validated['capacity'];
            if (isset($validated['is_active'])) $updateData['is_active'] = $validated['is_active'];
            
            if (!empty($updateData)) {
                $class->update($updateData);
            }

            // Update slug if name changed
            if ($class->isDirty('name')) {
                $class->update(['slug' => \Illuminate\Support\Str::slug($class->name)]);
            }

            // Sync teachers (if provided)
            if (isset($validated['teacher_ids'])) {
                // Detach all existing teachers first (keep students)
                $class->users()->wherePivot('role_in_class', '!=', 'siswa')->detach();
                
                // Re-attach with roles
                foreach ($validated['teacher_ids'] as $index => $teacherId) {
                    $roleInClass = $index === 0 ? 'wali_kelas' : 'guru_pengampu';
                    
                    $class->users()->attach($teacherId, [
                        'role_in_class' => $roleInClass,
                        'academic_year' => date('Y'),
                        'is_active' => true,
                    ]);
                }
            }

            // Sync subjects (if provided) via class_subject pivot table
            if (isset($validated['subject_ids'])) {
                $class->subjectsRelation()->sync($validated['subject_ids']);
            }

            DB::commit();

            $class->load(['teachers', 'waliKelasRelation', 'subjectsRelation'])
                  ->loadCount(['students', 'subjectsRelation as subjects_count']);

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas berhasil diupdate.',
                'code' => 'UPDATE_SUCCESS',
                'data' => $class,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ClassController::update failed', [
                'class_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Delete class (single or bulk)
     * 
     * @param Request $request
     * @param int|null $id
     * @return JsonResponse
     */
    public function destroy(Request $request, ?int $id = null): JsonResponse
    {
        try {
            // Support single delete via route param OR bulk delete via request body
            $ids = $id ? [$id] : $request->input('ids', []);
            
            if (empty($ids)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'ID kelas harus disertakan.',
                    'code' => 'MISSING_ID',
                ], 400);
            }

            DB::beginTransaction();

            foreach ($ids as $classId) {
                $class = ClassModel::find($classId);
                
                if ($class) {
                    // Detach all teacher relationships first (keep students for soft delete scenario)
                    $class->users()->wherePivot('role_in_class', '!=', 'siswa')->detach();
                    
                    // Detach subjects from pivot table
                    $class->subjectsRelation()->detach();
                    
                    // Delete the class (cascade will handle related records if configured)
                    $class->delete();
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => count($ids) > 1 
                    ? count($ids) . ' kelas berhasil dihapus.' 
                    : 'Kelas berhasil dihapus.',
                'code' => 'DELETE_SUCCESS',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ClassController::destroy failed', [
                'ids' => $id ? [$id] : $request->input('ids'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus kelas: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Export classes to CSV
     * 
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function export(Request $request)
    {
        $filters = $request->only(['level', 'is_active', 'search']);
        
        $query = ClassModel::query()
            ->withCount(['students', 'subjectsRelation as subjects_count'])
            ->with([
                'teachers' => fn($q) => $q->select('users.name')->limit(3),
                'waliKelasRelation'
            ]);

        if (!empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }
        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        $classes = $query->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="classes-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($classes) {
            $file = fopen('php://output', 'w');
            
            // BOM for Excel UTF-8 support
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Header row
            fputcsv($file, [
                'ID', 'Nama Kelas', 'Level', 'Deskripsi', 'Kapasitas', 
                'Jumlah Siswa', 'Jumlah Mapel', 'Wali Kelas', 'Status', 'Dibuat'
            ]);
            
            // Data rows
            foreach ($classes as $class) {
                fputcsv($file, [
                    $class->id,
                    $class->name,
                    'Kelas ' . $class->level,
                    $class->description ?? '',
                    $class->capacity,
                    $class->students_count ?? 0,
                    $class->subjects_count ?? 0,
                    $class->wali_kelas->name ?? '-',
                    $class->is_active ? 'Aktif' : 'Non-Aktif',
                    $class->created_at?->format('Y-m-d H:i'),
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Bulk delete classes
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        return $this->destroy($request);
    }
}