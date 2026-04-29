<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ClassService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClassController extends Controller
{
    public function __construct(protected ClassService $classService)
    {
        //
    }

    /**
     * Get paginated classes
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $classes = $this->classService->all(
            $request->only(['level', 'is_active', 'search'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Kelas berhasil diambil.',
            'code' => 'CLASSES_SUCCESS',
            'data' => $classes,
            'meta' => [
                'current_page' => $classes->currentPage(),
                'per_page' => $classes->perPage(),
                'total' => $classes->total(),
                'last_page' => $classes->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get class detail
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $class = $this->classService->find($id);

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
     * Create new class
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $result = $this->classService->create(
            $request->validate([
                'name' => 'required|string|max:255',
                'level' => 'required|in:X,XI,XII',
                'description' => 'nullable|string|max:1000',
                'capacity' => 'sometimes|integer|min:1|max:50',
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
            'data' => $result['class'],
        ], 201);
    }

    /**
     * Update class
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $result = $this->classService->update($id, $request->validate([
            'name' => 'sometimes|string|max:255',
            'level' => 'sometimes|in:X,XI,XII',
            'description' => 'nullable|string|max:1000',
            'capacity' => 'sometimes|integer|min:1|max:50',
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
            'data' => $result['class'],
        ], 200);
    }

    /**
     * Delete class
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $result = $this->classService->delete($id);

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
