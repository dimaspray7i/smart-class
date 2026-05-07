<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
        // Middleware will handle auth & role checks
    }

    /**
     * Get paginated users with filters
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['role', 'is_active', 'search']);
        
        // Handle boolean conversion for is_active
        if (isset($filters['is_active'])) {
            $filters['is_active'] = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        $users = $this->userService->paginate($filters);

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil diambil.',
            'code' => 'USERS_SUCCESS',
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ],
        ], 200);
    }

    /**
     * Get user detail by ID (with profile & subjects)
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

        // Load relationships for detailed view
        $user->load(['profile', 'profile.subjects']);

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil diambil.',
            'code' => 'USER_SUCCESS',
            'data' => $user,
        ], 200);
    }

    /**
     * Create new user (ADMIN ONLY)
     */
    public function store(Request $request): JsonResponse
    {
        $role = $request->input('role');
        
        // Base validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', Password::min(8)->mixedCase()->numbers()],
            'role' => 'required|in:admin,guru,siswa',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            
            // Profile fields (conditionally required)
            'nis' => $role === 'siswa' ? 'required|string|max:20|unique:profiles,nis' : 'nullable|string|max:20',
            'nip' => $role === 'guru' ? 'required|string|max:20|unique:profiles,nip' : 'nullable|string|max:20',
            'class_level' => $role === 'siswa' ? 'required|in:X,XI,XII' : 'nullable|in:X,XI,XII',
            
            // Teacher subjects (array of subject IDs)
            'subjects' => $role === 'guru' ? 'required|array|min:1' : 'nullable|array',
            'subjects.*' => $role === 'guru' ? 'exists:subjects,id' : 'nullable',
            
            // Optional profile fields
            'bio' => 'nullable|string|max:1000',
            'github_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
        ];

        // Custom error messages
        $messages = [
            'nis.required' => 'NIS wajib diisi untuk siswa.',
            'nis.unique' => 'NIS sudah terdaftar.',
            'nip.required' => 'NIP wajib diisi untuk guru.',
            'nip.unique' => 'NIP sudah terdaftar.',
            'class_level.required' => 'Kelas wajib dipilih untuk siswa.',
            'class_level.in' => 'Pilih kelas yang valid (X, XI, atau XII).',
            'subjects.required' => 'Minimal satu mata pelajaran wajib dipilih untuk guru.',
            'subjects.array' => 'Format mata pelajaran tidak valid.',
            'subjects.*.exists' => 'Terdapat mata pelajaran yang tidak valid.',
        ];

        $validated = $request->validate($rules, $messages);

        try {
            DB::beginTransaction();

            $result = $this->userService->create($validated);

            if (!$result['success']) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'CREATE_FAILED',
                    'errors' => $result['errors'] ?? null,
                ], 400);
            }

            // Attach subjects for teacher if provided
            if ($role === 'guru' && !empty($validated['subjects'])) {
                $result['user']->profile->subjects()->sync($validated['subjects']);
            }

            DB::commit();

            // Reload user with relationships for response
            $result['user']->load(['profile', 'profile.subjects']);

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'CREATE_SUCCESS',
                'data' => $result['user'],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('UserController::store failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat user: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update existing user (ADMIN ONLY) - Email CAN be edited
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->find($id);
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $role = $request->input('role', $user->role);
        
        // Validation rules - email is editable (unique check excludes current user)
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            
            // Profile fields (conditionally validated)
            'nis' => $role === 'siswa' 
                ? 'sometimes|required|string|max:20|unique:profiles,nis,' . $id . ',user_id' 
                : 'nullable|string|max:20',
            'nip' => $role === 'guru' 
                ? 'sometimes|required|string|max:20|unique:profiles,nip,' . $id . ',user_id' 
                : 'nullable|string|max:20',
            'class_level' => 'nullable|in:X,XI,XII',
            
            // Teacher subjects (array of subject IDs)
            'subjects' => $role === 'guru' ? 'sometimes|required|array|min:1' : 'nullable|array',
            'subjects.*' => $role === 'guru' ? 'exists:subjects,id' : 'nullable',
            
            // Optional profile fields
            'bio' => 'nullable|string|max:1000',
            'github_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
        ];

        $messages = [
            'email.unique' => 'Email sudah digunakan oleh user lain.',
            'nis.unique' => 'NIS sudah terdaftar.',
            'nip.unique' => 'NIP sudah terdaftar.',
            'subjects.required' => 'Minimal satu mata pelajaran wajib dipilih untuk guru.',
            'subjects.*.exists' => 'Terdapat mata pelajaran yang tidak valid.',
        ];

        $validated = $request->validate($rules, $messages);

        try {
            DB::beginTransaction();

            $result = $this->userService->update($id, $validated);

            if (!$result['success']) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'UPDATE_FAILED',
                    'errors' => $result['errors'] ?? null,
                ], 400);
            }

            // Sync subjects for teacher if provided
            if ($role === 'guru' && isset($validated['subjects'])) {
                $result['user']->profile->subjects()->sync($validated['subjects']);
            }

            DB::commit();

            // Reload user with relationships for response
            $result['user']->load(['profile', 'profile.subjects']);

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'UPDATE_SUCCESS',
                'data' => $result['user'],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('UserController::update failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update user: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Delete user (ADMIN ONLY)
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
     * Reset user password (ADMIN ONLY)
     */
    public function resetPassword(int $id, Request $request): JsonResponse
    {
        $newPassword = $request->input('password', 'password123');
        
        $result = $this->userService->resetPassword($id, $newPassword);

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
     * Update user role (ADMIN ONLY)
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

        $validated = $request->validate([
            'role' => 'required|in:admin,guru,siswa',
        ]);

        $result = $this->userService->updateRole($id, $validated['role']);

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