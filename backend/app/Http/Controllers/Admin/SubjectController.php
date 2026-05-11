<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SubjectService;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SubjectController extends Controller
{
    /**
     * Constructor dengan Dependency Injection
     */
    public function __construct(protected SubjectService $subjectService)
    {
        // Middleware akan menangani autentikasi dan otorisasi
    }

    /**
     * Display a listing of the subjects with pagination and filters
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $subjects = $this->subjectService->all(
            $request->only(['category', 'is_active', 'search', 'credits_min', 'credits_max', 'sort', 'all'])
        );

        $responseData = [
            'status' => 'success',
            'message' => 'Mapel berhasil diambil.',
            'code' => 'SUBJECTS_SUCCESS',
            'data' => $request->has('all') ? $subjects : $subjects->items(),
        ];

        if (!$request->has('all')) {
            $responseData['meta'] = [
                'current_page' => $subjects->currentPage(),
                'per_page' => $subjects->perPage(),
                'total' => $subjects->total(),
                'last_page' => $subjects->lastPage(),
                'from' => $subjects->firstItem(),
                'to' => $subjects->lastItem(),
            ];
        }

        return response()->json($responseData, 200);
    }

    /**
     * Display the specified subject with relationships and counts
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $subject = Subject::withCount(['schedules', 'classes'])
            ->with(['profiles.user' => function($query) {
                $query->select('id', 'name', 'email');
            }])
            ->find($id);

        if (!$subject) {
            return response()->json([
                'status' => 'error',
                'message' => 'Mapel tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Mapel berhasil diambil.',
            'code' => 'SUBJECT_SUCCESS',
            'data' => [
                'id' => $subject->id,
                'code' => $subject->code,
                'name' => $subject->name,
                'category' => $subject->category,
                'category_label' => $subject->category_label,
                'credits' => $subject->credits,
                'description' => $subject->description,
                'is_active' => $subject->is_active,
                'schedules_count' => $subject->schedules_count,
                'classes_count' => $subject->classes_count,
                'teachers' => $subject->profiles->map(function ($profile) {
                    return [
                        'id' => $profile->user?->id,
                        'name' => $profile->user?->name,
                        'email' => $profile->user?->email,
                    ];
                })->filter()->values(),
                'created_at' => $subject->created_at?->toDateTimeString(),
                'updated_at' => $subject->updated_at?->toDateTimeString(),
            ],
        ], 200);
    }

    /**
     * Store a newly created subject in storage
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:subjects,code',
            'name' => 'required|string|max:255',
            'category' => 'required|in:productive,normative,adaptive',
            'credits' => 'sometimes|integer|min:1|max:10',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $result = $this->subjectService->create($validated);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CREATE_FAILED',
                'errors' => $result['errors'] ?? null,
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'CREATE_SUCCESS',
            'data' => $result['subject'],
        ], 201);
    }

    /**
     * Update the specified subject in storage
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:50|unique:subjects,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|in:productive,normative,adaptive',
            'credits' => 'sometimes|integer|min:1|max:10',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $result = $this->subjectService->update($id, $validated);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'UPDATE_FAILED',
                'errors' => $result['errors'] ?? null,
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'UPDATE_SUCCESS',
            'data' => $result['subject'],
        ], 200);
    }

    /**
     * Remove the specified subject from storage (support single or bulk delete)
     * 
     * @param Request $request
     * @param int|null $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id = null): JsonResponse
    {
        // Support bulk delete via request body
        $ids = $request->input('ids', $id ? [$id] : []);
        
        if (empty($ids)) {
            return response()->json([
                'status' => 'error',
                'message' => 'ID mata pelajaran tidak ditemukan.',
                'code' => 'INVALID_ID',
            ], 400);
        }

        $results = [];
        
        foreach ($ids as $subjectId) {
            $result = $this->subjectService->delete($subjectId);
            $results[] = $result;
        }

        $success = collect($results)->every(function ($result) {
            return $result['success'] === true;
        });

        if (!$success) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus satu atau lebih mata pelajaran.',
                'code' => 'DELETE_FAILED',
            ], 400);
        }

        $message = count($ids) > 1 
            ? count($ids) . ' mata pelajaran berhasil dihapus.' 
            : 'Mata pelajaran berhasil dihapus.';

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'code' => 'DELETE_SUCCESS',
        ], 200);
    }

    /**
     * Export subjects to CSV file
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function export(Request $request)
    {
        try {
            $filters = $request->only(['category', 'is_active', 'search']);
            
            $query = Subject::query();
            
            // Apply category filter
            if (!empty($filters['category'])) {
                $query->where('category', $filters['category']);
            }
            
            // Apply is_active filter
            if (isset($filters['is_active'])) {
                $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
                $query->where('is_active', $isActive);
            }
            
            // Apply search filter
            if (!empty($filters['search'])) {
                $query->where(function($q) use ($filters) {
                    $q->where('name', 'like', "%{$filters['search']}%")
                      ->orWhere('code', 'like', "%{$filters['search']}%");
                });
            }
            
            $subjects = $query->withCount(['schedules', 'classes'])->get();
            
            // Set headers for CSV download
            $headers = [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="subjects-' . date('Y-m-d') . '.csv"',
            ];
            
            // Generate CSV content
            $callback = function() use ($subjects) {
                $file = fopen('php://output', 'w');
                
                // Add BOM for UTF-8 Excel compatibility
                fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
                
                // Write header row
                fputcsv($file, [
                    'ID',
                    'Kode',
                    'Nama',
                    'Kategori',
                    'Kredit',
                    'Deskripsi',
                    'Status',
                    'Jumlah Jadwal',
                    'Jumlah Kelas',
                    'Tanggal Dibuat'
                ], ';');
                
                // Write data rows
                foreach ($subjects as $subject) {
                    fputcsv($file, [
                        $subject->id,
                        $subject->code,
                        $subject->name,
                        $subject->category_label,
                        $subject->credits,
                        strip_tags($subject->description),
                        $subject->is_active ? 'Aktif' : 'Non-Aktif',
                        $subject->schedules_count,
                        $subject->classes_count,
                        $subject->created_at?->format('d/m/Y H:i:s'),
                    ], ';');
                }
                
                fclose($file);
            };
            
            return response()->stream($callback, 200, $headers);
            
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export data: ' . $e->getMessage(),
                'code' => 'EXPORT_FAILED',
            ], 500);
        }
    }
}