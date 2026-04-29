<?php

namespace App\Services;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Exception;

class UserService
{
    /**
     * Get paginated users
     */
    public function paginate(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = User::query();

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['is_active'])) {
            $query->where('is_active', $filters['is_active'] === 'true');
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    /**
     * Find user by ID
     */
    public function find(int $id): ?User
    {
        return User::with(['profile', 'classes', 'skills'])->find($id);
    }

    /**
     * Create new user
     */
    public function create(array $data): array
    {
        try {
            if (User::where('email', $data['email'])->exists()) {
                return [
                    'success' => false,
                    'message' => 'Email sudah terdaftar.',
                    'code' => 'EMAIL_EXISTS',
                ];
            }

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Create profile
            Profile::create([
                'user_id' => $user->id,
                'nis' => $data['nis'] ?? null,
                'nip' => $data['nip'] ?? null,
                'class_level' => $data['class_level'] ?? null,
            ]);

            return [
                'success' => true,
                'message' => 'User berhasil dibuat.',
                'user' => $user->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('UserService::create failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat user.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Update user
     */
    public function update(int $id, array $data): array
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $user->update($data);

            return [
                'success' => true,
                'message' => 'User berhasil diupdate.',
                'user' => $user->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('UserService::update failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update user.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Delete user
     */
    public function delete(int $id): array
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $user->delete();

            return [
                'success' => true,
                'message' => 'User berhasil dihapus.',
            ];

        } catch (Exception $e) {
            Log::error('UserService::delete failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghapus user.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(int $id, string $newPassword): array
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $user->update(['password' => $newPassword]);
            $user->tokens()->delete(); // Revoke all tokens

            return [
                'success' => true,
                'message' => 'Password berhasil direset.',
            ];

        } catch (Exception $e) {
            Log::error('UserService::resetPassword failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal reset password.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Update user role
     */
    public function updateRole(int $id, string $role): array
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $validRoles = ['admin', 'guru', 'siswa'];
            if (!in_array($role, $validRoles)) {
                return [
                    'success' => false,
                    'message' => 'Role tidak valid.',
                    'code' => 'INVALID_ROLE',
                ];
            }

            $user->update(['role' => $role]);

            return [
                'success' => true,
                'message' => 'Role berhasil diupdate.',
                'user' => $user->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('UserService::updateRole failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update role.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }
}