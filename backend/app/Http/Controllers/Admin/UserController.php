<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
        //
    }

    /**
     * Get paginated users
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $users = $this->userService->paginate(
            $request->only(['role', 'is_active', 'search'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil diambil.',
            'code' => 'USERS_SUCCESS',
            'data' => $users,
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get user detail
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil diambil.',
            'code' => 'USER_SUCCESS',
            'data' => $user,
        ], 200);
    }

    /**
     * Create new user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $result = $this->userService->create(
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,guru,siswa',
                'phone' => 'nullable|string|max:20',
                'is_active' => 'boolean',
                'nis' => 'nullable|string|max:20',
                'nip' => 'nullable|string|max:20',
                'class_level' => 'nullable|in:X,XI,XII',
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
            'data' => $result['user'],
        ], 201);
    }

    /**
     * Update user
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $result = $this->userService->update($id, $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
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
            'data' => $result['user'],
        ], 200);
    }

    /**
     * Delete user
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        // Prevent self-deletion
        if ($id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menghapus akun sendiri.',
                'code' => 'SELF_DELETE_FORBIDDEN',
            ], 403);
        }

        $result = $this->userService->delete($id);

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

    /**
     * Reset user password
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(int $id, Request $request): JsonResponse
    {
        $result = $this->userService->resetPassword(
            $id,
            $request->input('password', 'password123')
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'RESET_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'RESET_SUCCESS',
        ], 200);
    }

    /**
     * Update user role
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function updateRole(int $id, Request $request): JsonResponse
    {
        // Prevent changing own role
        if ($id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat mengubah role sendiri.',
                'code' => 'SELF_ROLE_CHANGE_FORBIDDEN',
            ], 403);
        }

        $result = $this->userService->updateRole(
            $id,
            $request->validate([
                'role' => 'required|in:admin,guru,siswa',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'ROLE_UPDATE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'ROLE_UPDATE_SUCCESS',
            'data' => $result['user'],
        ], 200);
    }
}