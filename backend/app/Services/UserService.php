<?php

namespace App\Services;

use App\Models\User;
use App\Models\Profile;
use App\Models\Subject;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class UserService
{
    /**
     * Get paginated users with filters
     * 
     * @param array $filters ['role', 'is_active', 'search']
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginate(array $filters = []): mixed
    {
        $query = User::query();

        // Filter by role
        if (!empty($filters['role']) && in_array($filters['role'], ['admin', 'guru', 'siswa'])) {
            $query->where('role', $filters['role']);
        }

        // Filter by is_active (handle boolean/string/int)
        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Search by name, email, or phone
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $search = "%{$filters['search']}%";
                $q->where('name', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('phone', 'like', $search);
            });
        }

        if (!empty($filters['all'])) {
            return $query
                ->with(['profile', 'profile.subjects', 'classes'])
                ->orderBy('name', 'asc')
                ->get();
        }

        return $query
            ->with(['profile', 'profile.subjects', 'classes'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    }

    /**
     * Find user by ID with relationships
     * 
     * @param int $id
     * @return User|null
     */
    public function find(int $id): ?User
    {
        return User::with(['profile', 'profile.subjects', 'classes', 'skills'])->find($id);
    }

    /**
     * Create new user with profile (ADMIN ONLY)
     * 
     * @param array $data Validated request data (includes 'subjects' array for guru)
     * @return array ['success' => bool, 'message' => string, 'user' => ?User, 'code' => string]
     */
    public function create(array $data): array
    {
        try {
            DB::beginTransaction();

            // 1. Validate email uniqueness (double-check)
            if (User::where('email', $data['email'])->exists()) {
                return [
                    'success' => false,
                    'message' => 'Email sudah terdaftar.',
                    'code' => 'EMAIL_EXISTS',
                ];
            }

            // 2. Validate role-specific required fields BEFORE creating user
            $role = $data['role'] ?? 'siswa';
            
            if ($role === 'siswa') {
                if (empty($data['nis'])) {
                    return [
                        'success' => false,
                        'message' => 'NIS wajib diisi untuk siswa.',
                        'code' => 'VALIDATION_ERROR',
                        'errors' => ['nis' => ['NIS wajib diisi untuk siswa.']],
                    ];
                }
                if (empty($data['class_level']) || !in_array($data['class_level'], ['X', 'XI', 'XII'])) {
                    return [
                        'success' => false,
                        'message' => 'Kelas wajib dipilih untuk siswa.',
                        'code' => 'VALIDATION_ERROR',
                        'errors' => ['class_level' => ['Pilih kelas yang valid (X, XI, atau XII).']],
                    ];
                }
                // Check NIS uniqueness
                if (Profile::where('nis', $data['nis'])->exists()) {
                    return [
                        'success' => false,
                        'message' => 'NIS sudah terdaftar.',
                        'code' => 'NIS_EXISTS',
                        'errors' => ['nis' => ['NIS sudah terdaftar.']],
                    ];
                }
            }

            if ($role === 'guru') {
                if (empty($data['nip'])) {
                    return [
                        'success' => false,
                        'message' => 'NIP wajib diisi untuk guru.',
                        'code' => 'VALIDATION_ERROR',
                        'errors' => ['nip' => ['NIP wajib diisi untuk guru.']],
                    ];
                }
                // Check NIP uniqueness
                if (Profile::where('nip', $data['nip'])->exists()) {
                    return [
                        'success' => false,
                        'message' => 'NIP sudah terdaftar.',
                        'code' => 'NIP_EXISTS',
                        'errors' => ['nip' => ['NIP sudah terdaftar.']],
                    ];
                }
                // Validate subjects for guru
                if (!empty($data['subjects'])) {
                    $validSubjectIds = Subject::whereIn('id', $data['subjects'])->pluck('id')->toArray();
                    if (count($validSubjectIds) !== count($data['subjects'])) {
                        return [
                            'success' => false,
                            'message' => 'Terdapat mata pelajaran yang tidak valid.',
                            'code' => 'INVALID_SUBJECTS',
                            'errors' => ['subjects' => ['Terdapat mata pelajaran yang tidak valid.']],
                        ];
                    }
                }
            }

            // 3. Create User (password auto-hashed by 'hashed' cast in Model)
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'], // ✅ Cast 'hashed' handles this
                'role' => $role,
                'phone' => $data['phone'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ]);

            // 4. Create Profile based on role
            $profileData = [
                'user_id' => $user->id,
                'bio' => $data['bio'] ?? null,
                'github_url' => $data['github_url'] ?? null,
                'linkedin_url' => $data['linkedin_url'] ?? null,
            ];

            if ($role === 'siswa') {
                $profileData['nis'] = $data['nis'];
                $profileData['class_level'] = $data['class_level'];
            }
            if ($role === 'guru') {
                $profileData['nip'] = $data['nip'];
            }

            $profile = Profile::create($profileData);

            // 5. Handle Student Class Enrollment
            if ($role === 'siswa' && !empty($data['class_id'])) {
                $user->classes()->attach($data['class_id'], [
                    'role_in_class' => 'siswa',
                    'academic_year' => date('Y'),
                    'is_active' => true,
                ]);
            }

            // 6. Handle avatar upload if provided
            if (isset($data['avatar']) && $data['avatar']) {
                $avatarPath = $data['avatar']->store('avatars', 'public');
                $user->update(['avatar_url' => $avatarPath]);
            }

            // 7. Sync subjects for teacher (via pivot table teacher_subjects)
            if ($role === 'guru' && !empty($data['subjects'])) {
                Log::info('UserService::create - Syncing subjects for teacher', [
                    'user_id' => $user->id,
                    'subjects' => $data['subjects']
                ]);
                $profile->subjects()->sync($data['subjects']);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => "User {$role} berhasil dibuat.",
                'code' => 'CREATE_SUCCESS',
                'user' => $user->fresh()->load(['profile', 'profile.subjects', 'classes']),
            ];

        } catch (Exception $e) {
            DB::rollBack();

            // Cleanup: delete user if profile creation fails
            if (isset($user) && $user->exists) {
                $user->delete();
            }

            Log::error('UserService::create failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'data' => array_diff_key($data, array_flip(['password'])),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat user: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Update existing user with profile (ADMIN ONLY) - Email CAN be edited
     * 
     * @param int $id User ID
     * @param array $data Validated request data (may include 'subjects' array for guru)
     * @return array ['success' => bool, 'message' => string, 'user' => ?User, 'code' => string]
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

            // Prevent changing email to existing one (excluding self) - EMAIL IS EDITABLE
            if (isset($data['email']) && $data['email'] !== $user->email) {
                if (User::where('email', $data['email'])->where('id', '!=', $id)->exists()) {
                    return [
                        'success' => false,
                        'message' => 'Email sudah digunakan user lain.',
                        'code' => 'EMAIL_EXISTS',
                        'errors' => ['email' => ['Email sudah digunakan user lain.']],
                    ];
                }
            }

            // Validate role-specific fields if role is changing or data includes them
            $role = $data['role'] ?? $user->role;

            if ($role === 'siswa') {
                // If NIS is being updated, check uniqueness
                if (isset($data['nis']) && $data['nis'] !== ($user->profile->nis ?? null)) {
                    if (Profile::where('nis', $data['nis'])->where('user_id', '!=', $id)->exists()) {
                        return [
                            'success' => false,
                            'message' => 'NIS sudah terdaftar.',
                            'code' => 'NIS_EXISTS',
                            'errors' => ['nis' => ['NIS sudah terdaftar.']],
                        ];
                    }
                }
            }

            if ($role === 'guru') {
                // If NIP is being updated, check uniqueness
                if (isset($data['nip']) && $data['nip'] !== ($user->profile->nip ?? null)) {
                    if (Profile::where('nip', $data['nip'])->where('user_id', '!=', $id)->exists()) {
                        return [
                            'success' => false,
                            'message' => 'NIP sudah terdaftar.',
                            'code' => 'NIP_EXISTS',
                            'errors' => ['nip' => ['NIP sudah terdaftar.']],
                        ];
                    }
                }
                
                // Validate subjects if provided
                if (isset($data['subjects']) && is_array($data['subjects']) && !empty($data['subjects'])) {
                    $validSubjectIds = Subject::whereIn('id', $data['subjects'])->pluck('id')->toArray();
                    if (count($validSubjectIds) !== count($data['subjects'])) {
                        return [
                            'success' => false,
                            'message' => 'Terdapat mata pelajaran yang tidak valid.',
                            'code' => 'INVALID_SUBJECTS',
                            'errors' => ['subjects' => ['Terdapat mata pelajaran yang tidak valid.']],
                        ];
                    }
                }
            }

            // Update User
            $user->update($data);

            // Handle avatar upload if provided
            if (isset($data['avatar']) && $data['avatar']) {
                $avatarPath = $data['avatar']->store('avatars', 'public');
                $user->update(['avatar_url' => $avatarPath]);
            }

            // Update or Create Profile
            $profileData = array_filter([
                'bio' => $data['bio'] ?? null,
                'github_url' => $data['github_url'] ?? null,
                'linkedin_url' => $data['linkedin_url'] ?? null,
            ], fn($v) => $v !== null);

            // Add role-specific fields only if present in request
            if ($role === 'siswa' && isset($data['nis'])) {
                $profileData['nis'] = $data['nis'];
            }
            if ($role === 'siswa' && isset($data['class_level'])) {
                $profileData['class_level'] = $data['class_level'];
            }
            if ($role === 'guru' && isset($data['nip'])) {
                $profileData['nip'] = $data['nip'];
            }

            if ($user->profile) {
                // Update existing profile
                if (!empty($profileData)) {
                    $user->profile->update($profileData);
                }
                
                // Sync subjects for teacher if provided in request
                if ($role === 'guru' && isset($data['subjects']) && is_array($data['subjects'])) {
                    Log::info('UserService::update - Syncing subjects for teacher', [
                        'user_id' => $user->id,
                        'subjects' => $data['subjects']
                    ]);
                    $user->profile->subjects()->sync($data['subjects']);
                }

                // Sync class for student if provided
                if ($role === 'siswa' && isset($data['class_id'])) {
                    // Detach current student class enrollment
                    $user->classes()->wherePivot('role_in_class', 'siswa')->detach();
                    
                    if (!empty($data['class_id'])) {
                        $user->classes()->attach($data['class_id'], [
                            'role_in_class' => 'siswa',
                            'academic_year' => date('Y'),
                            'is_active' => true,
                        ]);
                    }
                }
            } else {
                // Create profile if doesn't exist (edge case)
                $profileData['user_id'] = $user->id;
                $profile = Profile::create($profileData);
                
                // Sync subjects for teacher if provided
                if ($role === 'guru' && !empty($data['subjects'])) {
                    $profile->subjects()->sync($data['subjects']);
                }
            }

            return [
                'success' => true,
                'message' => 'User berhasil diupdate.',
                'code' => 'UPDATE_SUCCESS',
                'user' => $user->fresh()->load(['profile', 'profile.subjects', 'classes']),
            ];

        } catch (Exception $e) {
            Log::error('UserService::update failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update user.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Delete user (soft delete or hard delete based on config)
     * 
     * @param int $id
     * @return array ['success' => bool, 'message' => string, 'code' => string]
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

            // Prevent deleting self
            if ($id === auth()->id()) {
                return [
                    'success' => false,
                    'message' => 'Tidak dapat menghapus akun sendiri.',
                    'code' => 'SELF_DELETE_FORBIDDEN',
                ];
            }

            // Delete user (cascade will delete profile via foreign key constraint)
            $user->delete();

            return [
                'success' => true,
                'message' => 'User berhasil dihapus.',
                'code' => 'DELETE_SUCCESS',
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
     * Delete multiple users
     * 
     * @param array $ids
     * @return array ['success' => bool, 'message' => string, 'code' => string]
     */
    public function deleteMultiple(array $ids): array
    {
        try {
            $users = User::whereIn('id', $ids)->get();

            if ($users->isEmpty()) {
                return [
                    'success' => false,
                    'message' => 'Tidak ada user yang ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            // Prevent deleting self
            $selfId = auth()->id();
            if (in_array($selfId, $ids)) {
                return [
                    'success' => false,
                    'message' => 'Tidak dapat menghapus akun sendiri.',
                    'code' => 'SELF_DELETE_FORBIDDEN',
                ];
            }

            // Delete users (cascade will delete profiles via foreign key constraint)
            User::whereIn('id', $ids)->delete();

            return [
                'success' => true,
                'message' => count($ids) . ' user berhasil dihapus.',
                'code' => 'DELETE_SUCCESS',
            ];

        } catch (Exception $e) {
            Log::error('UserService::deleteMultiple failed', [
                'user_ids' => $ids,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghapus users.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get all users for export (without pagination)
     * 
     * @param array $filters
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getAllForExport(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = User::query();

        // Filter by role
        if (!empty($filters['role']) && in_array($filters['role'], ['admin', 'guru', 'siswa'])) {
            $query->where('role', $filters['role']);
        }

        // Filter by is_active (handle boolean/string/int)
        if (isset($filters['is_active'])) {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        // Search by name, email, or phone
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $search = "%{$filters['search']}%";
                $q->where('name', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('phone', 'like', $search);
            });
        }

        return $query
            ->with(['profile'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Reset user password
     * 
     * @param int $id
     * @param string $newPassword
     * @return array ['success' => bool, 'message' => string, 'code' => string]
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

            // Update password (auto-hashed by cast)
            $user->update(['password' => $newPassword]);
            
            // Revoke all tokens for security
            $user->tokens()->delete();

            return [
                'success' => true,
                'message' => 'Password berhasil direset. User harus login ulang.',
                'code' => 'RESET_SUCCESS',
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
     * 
     * @param int $id
     * @param string $role
     * @return array ['success' => bool, 'message' => string, 'user' => ?User, 'code' => string]
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

            // Prevent changing own role
            if ($id === auth()->id()) {
                return [
                    'success' => false,
                    'message' => 'Tidak dapat mengubah role sendiri.',
                    'code' => 'SELF_ROLE_CHANGE_FORBIDDEN',
                ];
            }

            // Validate role value
            if (!in_array($role, ['admin', 'guru', 'siswa'])) {
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
                'code' => 'ROLE_UPDATE_SUCCESS',
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

    /**
     * Get user by email
     * 
     * @param string $email
     * @return User|null
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->with(['profile', 'profile.subjects'])->first();
    }

    /**
     * Count users by role
     * 
     * @param string|null $role
     * @return int
     */
    public function countByRole(?string $role = null): int
    {
        $query = User::query();
        
        if ($role && in_array($role, ['admin', 'guru', 'siswa'])) {
            $query->where('role', $role);
        }
        
        return $query->count();
    }

    /**
     * Get active users count
     * 
     * @return int
     */
    public function countActive(): int
    {
        return User::where('is_active', true)->count();
    }

    /**
     * Get users with subjects for teacher dashboard
     * 
     * @param int $teacherId
     * @return array
     */
    public function getTeacherWithSubjects(int $teacherId): array
    {
        $user = User::with(['profile.subjects'])->find($teacherId);
        
        if (!$user || $user->role !== 'guru') {
            return [];
        }
        
        return [
            'user' => $user,
            'subjects' => $user->profile?->subjects ?? [],
        ];
    }
}