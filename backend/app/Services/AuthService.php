<?php

namespace App\Services;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class AuthService
{
    /**
     * Authenticate user and return token
     * 
     * @param array $credentials ['email', 'password']
     * @return array ['success' => bool, 'message' => string, 'data' => ?array]
     */
    public function login(array $credentials): array
    {
        try {
            // Attempt authentication
            if (!Auth::attempt($credentials)) {
                return [
                    'success' => false,
                    'message' => 'Email atau password salah.',
                    'code' => 'INVALID_CREDENTIALS'
                ];
            }

            $user = Auth::user();

            // Check if user is active
            if (!$user->is_active) {
                Auth::logout();
                return [
                    'success' => false,
                    'message' => 'Akun Anda tidak aktif. Hubungi administrator.',
                    'code' => 'ACCOUNT_INACTIVE'
                ];
            }

            // Update last login
            $user->updateLastLogin();

            // Create Sanctum token
            $token = $user->createToken('rpl_token')->plainTextToken;

            // Load relationships
            $user->load(['profile', 'classes']);

            return [
                'success' => true,
                'message' => 'Login berhasil.',
                'code' => 'LOGIN_SUCCESS',
                'user' => $user,
                'token' => $token,
            ];

        } catch (Exception $e) {
            Log::error('AuthService::login failed', [
                'email' => $credentials['email'] ?? null,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Terjadi kesalahan saat login.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Register new user
     * 
     * @param array $data ['name', 'email', 'password', 'role', 'phone', ...]
     * @return array ['success' => bool, 'message' => string, 'user' => ?User]
     */
    public function register(array $data): array
    {
        try {
            // Check if email already exists
            if (User::where('email', $data['email'])->exists()) {
                return [
                    'success' => false,
                    'message' => 'Email sudah terdaftar.',
                    'code' => 'EMAIL_EXISTS',
                    'errors' => ['email' => ['Email sudah terdaftar.']],
                ];
            }

            // Validate password strength
            $passwordValidation = $this->validatePassword($data['password']);
            if (!$passwordValidation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Password tidak memenuhi persyaratan.',
                    'code' => 'WEAK_PASSWORD',
                    'errors' => ['password' => $passwordValidation['errors']],
                ];
            }

            // Create user
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'], // Mutator will hash it
                'role' => $data['role'] ?? 'siswa',
                'phone' => $data['phone'] ?? null,
                'is_active' => true,
            ]);

            // Create profile based on role
            $this->createProfile($user, $data);

            return [
                'success' => true,
                'message' => 'Registrasi berhasil.',
                'code' => 'REGISTRATION_SUCCESS',
                'user' => $user,
            ];

        } catch (Exception $e) {
            Log::error('AuthService::register failed', [
                'email' => $data['email'] ?? null,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Terjadi kesalahan saat registrasi.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(User $user): void
    {
        // Revoke current token
        $user->currentAccessToken()->delete();
    }

    /**
     * Get user profile with relationships
     */
    public function profile(User $user): array
    {
        $user->load([
            'profile',
            'classes',
            'skills',
            'projects' => function ($query) {
                $query->latest()->limit(5);
            },
            'attendances' => function ($query) {
                $query->where('date', '>=', now()->subDays(30))->latest();
            }
        ]);

        return $user->toArray();
    }

    /**
     * Update user profile
     */
    public function updateProfile(User $user, array $data): array
    {
        try {
            // Check email uniqueness if changing email
            if (isset($data['email']) && $data['email'] !== $user->email) {
                if (User::where('email', $data['email'])->where('id', '!=', $user->id)->exists()) {
                    return [
                        'success' => false,
                        'message' => 'Email sudah digunakan user lain.',
                        'code' => 'EMAIL_EXISTS',
                    ];
                }
            }

            // Update user
            $user->update($data);

            // Update or create profile
            if ($user->profile) {
                $user->profile->update(array_filter([
                    'bio' => $data['bio'] ?? null,
                    'github_url' => $data['github_url'] ?? null,
                    'linkedin_url' => $data['linkedin_url'] ?? null,
                ]));
            } else {
                $this->createProfile($user, $data);
            }

            return [
                'success' => true,
                'message' => 'Profil berhasil diupdate.',
                'user' => $user->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('AuthService::updateProfile failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update profil.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Refresh authentication token
     */
    public function refresh(User $user): array
    {
        // Revoke all existing tokens
        $user->tokens()->delete();

        // Create new token
        $token = $user->createToken('rpl_token')->plainTextToken;

        return [
            'token' => $token,
            'type' => 'Bearer',
            'expires_in' => config('sanctum.expiration'),
        ];
    }

    /**
     * Reset user password
     */
    public function resetPassword(User $user, string $newPassword): array
    {
        try {
            $passwordValidation = $this->validatePassword($newPassword);
            if (!$passwordValidation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Password tidak memenuhi persyaratan.',
                    'errors' => $passwordValidation['errors'],
                ];
            }

            $user->update(['password' => $newPassword]);

            // Revoke all tokens for security
            $user->tokens()->delete();

            return [
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login ulang.',
            ];

        } catch (Exception $e) {
            Log::error('AuthService::resetPassword failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal reset password.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PRIVATE HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Validate password strength
     */
    private function validatePassword(string $password): array
    {
        $errors = [];
        $minLength = config('app.min_password_length', 8);

        if (strlen($password) < $minLength) {
            $errors[] = "Password minimal {$minLength} karakter.";
        }

        if (config('app.password_require_uppercase', true) && !preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password harus mengandung huruf kapital.';
        }

        if (config('app.password_require_number', true) && !preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password harus mengandung angka.';
        }

        if (config('app.password_require_special_char', false) && !preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
            $errors[] = 'Password harus mengandung karakter khusus.';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Create profile based on user role
     */
    private function createProfile(User $user, array $data): void
    {
        $profileData = [
            'user_id' => $user->id,
            'bio' => $data['bio'] ?? null,
            'github_url' => $data['github_url'] ?? null,
            'linkedin_url' => $data['linkedin_url'] ?? null,
        ];

        if ($user->role === 'siswa') {
            $profileData['nis'] = $data['nis'] ?? null;
            $profileData['class_level'] = $data['class_level'] ?? 'X';
        }

        if ($user->role === 'guru') {
            $profileData['nip'] = $data['nip'] ?? null;
        }

        Profile::create($profileData);
    }

    /**
     * Find user by email
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Find user by ID
     */
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Get user by token
     */
    public function getByToken(string $token): ?User
    {
        return User::has('tokens')
            ->whereHas('tokens', function ($query) use ($token) {
                $query->where('token', hash('sha256', $token));
            })
            ->first();
    }
}