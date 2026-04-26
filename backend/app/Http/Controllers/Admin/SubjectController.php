<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\SubjectService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubjectController extends Controller
{
    public function __construct(protected SubjectService $subjectService)
    {
        //
    }

    /**
     * Get paginated subjects
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $subjects = $this->subjectService->all(
            $request->only(['category', 'is_active', 'search'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Mapel berhasil diambil.',
            'code' => 'SUBJECTS_SUCCESS',
            'data' => $subjects,
            'meta' => [
                'current_page' => $subjects->currentPage(),
                'per_page' => $subjects->perPage(),
                'total' => $subjects->total(),
                'last_page' => $subjects->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get subject detail
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $subject = $this->subjectService->find($id);

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
            'data' => $subject,
        ], 200);
    }

    /**
     * Create new subject
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $result = $this->subjectService->create(
            $request->validate([
                'code' => 'required|string|max:50|unique:subjects,code',
                'name' => 'required|string|max:255',
                'category' => 'required|in:productive,normative,adaptive',
                'credits' => 'sometimes|integer|min:1|max:10',
                'description' => 'nullable|string|max:1000',
                'is_active' => 'boolean',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CREATE_FAILED',
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
     * Update subject
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $result = $this->subjectService->update($id, $request->validate([
            'code' => 'sometimes|string|max:50|unique:subjects,code,' . $id,
            'name' => 'sometimes|string|max:255',
            'category' => 'sometimes|in:productive,normative,adaptive',
            'credits' => 'sometimes|integer|min:1|max:10',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean',
        ]));

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'UPDATE_FAILED',
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
     * Delete subject
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $result = $this->subjectService->delete($id);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'DELETE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'DELETE_SUCCESS',
        ], 200);
    }
}