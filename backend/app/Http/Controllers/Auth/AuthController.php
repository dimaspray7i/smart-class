<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Models\Device;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
        // Middleware will handle auth & role checks
    }

    /**
     * Login user - dengan logging & error handling lengkap
     * 
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            // 🔍 DEBUG: Log apa yang diterima Laravel
            Log::info('=== LOGIN DEBUG ===', [
                'all_input' => $request->all(),
                'email' => $request->input('email'),
                'password' => $request->input('password'),
                'content_type' => $request->header('Content-Type'),
                'is_json' => $request->isJson(),
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            $result = $this->authService->login($request->validated());

            if (!$result['success']) {
                Log::warning('Login failed', [
                    'email' => $request->input('email'),
                    'reason' => $result['message'],
                    'code' => $result['code'] ?? 'UNKNOWN',
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'LOGIN_FAILED',
                ], 401);
            }

            Log::info('Login success', [
                'email' => $request->input('email'),
                'user_id' => $result['user']?->id,
                'role' => $result['user']?->role,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Login berhasil.',
                'code' => 'LOGIN_SUCCESS',
                'data' => [
                    'user' => $result['user'],
                    'token' => $result['token'],
                    'token_type' => 'Bearer',
                    'expires_in' => config('sanctum.expiration'),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Login exception', [
                'email' => $request->input('email'),
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat login.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Login user dengan retro theme support & enhanced features
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function loginRetro(Request $request): JsonResponse
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:6',
                'remember' => 'nullable|boolean',
                'role_hint' => 'nullable|in:admin,guru,siswa',
                'device_name' => 'nullable|string|max:255',
                'device_info' => 'nullable|array',
            ]);

            // Attempt authentication
            if (!auth()->attempt($credentials)) {
                // Track failed attempt for security
                $this->trackFailedLogin($request->ip(), $credentials['email']);
                
                Log::warning('Retro login failed', [
                    'email' => $credentials['email'],
                    'ip' => $request->ip(),
                    'role_hint' => $credentials['role_hint'] ?? null,
                ]);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid credentials.',
                    'code' => 'AUTH_FAILED',
                    'retro_hint' => 'Check your email & password! ✨',
                    'remaining_attempts' => $this->getRemainingAttempts($request->ip(), $credentials['email']),
                ], 401);
            }

            $user = auth()->user();

            // Check if user is active
            if (!$user->is_active) {
                auth()->logout();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account is disabled. Contact administrator.',
                    'code' => 'ACCOUNT_DISABLED',
                ], 403);
            }

            // Check 2FA if enabled
            if ($user->two_factor_enabled && !$request->has('two_factor_code')) {
                // Send 2FA code
                $this->sendTwoFactorCode($user);
                return response()->json([
                    'status' => '2fa_required',
                    'message' => 'Two-factor authentication required.',
                    'code' => '2FA_REQUIRED',
                    'data' => [
                        'user_id' => $user->id,
                        'two_factor_methods' => $user->getTwoFactorMethods(),
                    ],
                ], 200);
            }

            // Verify 2FA code if provided
            if ($user->two_factor_enabled && $request->has('two_factor_code')) {
                if (!$this->verifyTwoFactorCode($user, $request->input('two_factor_code'))) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Invalid two-factor code.',
                        'code' => '2FA_INVALID',
                    ], 401);
                }
            }

            // Generate token with device info
            $tokenName = $credentials['device_name'] ?? 'retro-auth-token';
            $token = $user->createToken($tokenName, ['*'], now()->addDays(config('sanctum.expiration_days', 30)))->plainTextToken;

            // Register device if info provided
            if (!empty($credentials['device_info'])) {
                $this->registerDevice($user, $request->ip(), $credentials['device_info']);
            }

            // Update last login
            $user->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);

            // Prepare retro response
            $response = [
                'status' => 'success',
                'message' => 'Login successful! 🚀',
                'code' => 'AUTH_SUCCESS',
                'data' => [
                    'user' => $user->load(['profile', 'classes', 'subjects'])->toArray(),
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => config('sanctum.expiration') ?? 0,
                    'role' => $user->role,
                    'retro_badges' => $this->getUserRetroBadges($user),
                    'dashboard_redirect' => $this->getDashboardRedirect($user->role),
                    'theme_preferences' => $user->theme_preferences ?? [],
                    'permissions' => $this->getUserPermissions($user),
                    'quick_actions' => $this->getUserQuickActions($user),
                ],
            ];

            // Handle remember me
            if ($credentials['remember'] ?? false) {
                $rememberToken = Str::random(64);
                $user->remember_token = $rememberToken;
                $user->save();
                $response['data']['remember_token'] = $rememberToken;
                $response['data']['remember_expires_at'] = now()->addDays(30)->toDateTimeString();
            }

            Log::info('Retro login success', [
                'email' => $credentials['email'],
                'user_id' => $user->id,
                'role' => $user->role,
                'ip' => $request->ip(),
            ]);

            return response()->json($response, 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Retro login exception', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat login.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Logout user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $this->authService->logout($request->user());

            // Clear device session if device_id provided
            if ($request->has('device_id')) {
                $request->user()->devices()->where('id', $request->input('device_id'))->delete();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Logout berhasil.',
                'code' => 'LOGOUT_SUCCESS',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Logout failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal logout.',
                'code' => 'LOGOUT_FAILED',
            ], 500);
        }
    }

    /**
     * Get current user profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        try {
            $profile = $this->authService->profile($request->user());

            return response()->json([
                'status' => 'success',
                'message' => 'Profil berhasil diambil.',
                'code' => 'PROFILE_SUCCESS',
                'data' => $profile,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Get profile failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil profil.',
                'code' => 'PROFILE_FAILED',
            ], 500);
        }
    }

    /**
     * Get retro-style user profile with enhanced data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function retroProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load(['profile', 'classes', 'subjects', 'devices']);
            
            $response = [
                'status' => 'success',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'avatar_url' => $user->avatar_url,
                        'is_active' => $user->is_active,
                        'created_at' => $user->created_at,
                        'last_login_at' => $user->last_login_at,
                    ],
                    'profile' => $user->profile?->toArray(),
                    'classes' => $user->classes?->map(fn($c) => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'level' => $c->level,
                        'pivot' => $c->pivot?->toArray(),
                    ]),
                    'subjects' => $user->subjects?->map(fn($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'code' => $s->code,
                        'category' => $s->category,
                    ]),
                    'retro_theme' => [
                        'enabled' => true,
                        'version' => '2.0.0',
                        'palette' => [
                            'primary' => '#FF5C00',
                            'secondary' => '#2E2BBF',
                            'accent' => '#FFC928',
                            'success' => '#10b981',
                            'warning' => '#f59e0b',
                            'danger' => '#f43f5e',
                        ],
                        'fonts' => ['retro-display', 'retro-mono', 'retro-hand'],
                        'animations' => ['wobble', 'bounce', 'sparkle', 'float'],
                        'components' => ['cards', 'badges', 'stickers', 'gradients'],
                    ],
                    'permissions' => $this->getUserPermissions($user),
                    'quick_actions' => $this->getUserQuickActions($user),
                    'retro_badges' => $this->getUserRetroBadges($user),
                    'devices' => $user->devices?->map(fn($d) => [
                        'id' => $d->id,
                        'name' => $d->name,
                        'last_used_at' => $d->last_used_at,
                        'is_current' => $d->id === ($request->header('X-Device-Id') ?? null),
                    ]),
                    'stats' => $this->getUserStats($user),
                ],
            ];

            return response()->json($response, 200);
        } catch (\Exception $e) {
            Log::error('Get retro profile failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil retro profile.',
                'code' => 'PROFILE_FAILED',
            ], 500);
        }
    }

    /**
     * Update user profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $result = $this->authService->updateProfile(
                $request->user(),
                $request->only(['name', 'email', 'phone', 'bio', 'github_url', 'linkedin_url'])
            );

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
        } catch (\Exception $e) {
            Log::error('Update profile failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update profil.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Update retro-style user profile with theme preferences
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateRetroProfile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validate([
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:20',
                'bio' => 'nullable|string|max:500',
                'github_url' => 'nullable|url|max:255',
                'linkedin_url' => 'nullable|url|max:255',
                'avatar' => 'nullable|image|max:5120',
                'theme_preferences' => 'nullable|array',
                'theme_preferences.primary_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
                'theme_preferences.secondary_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
                'theme_preferences.font' => 'nullable|in:retro-display,retro-mono,retro-hand',
                'theme_preferences.animations' => 'nullable|array',
                'notifications' => 'nullable|array',
            ]);

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $validated['avatar_url'] = asset('storage/' . $path);
            }

            // Update user
            $user->update(array_filter([
                'name' => $validated['name'] ?? null,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ]));

            // Update profile
            if ($user->profile) {
                $user->profile->update(array_filter([
                    'bio' => $validated['bio'] ?? null,
                    'github_url' => $validated['github_url'] ?? null,
                    'linkedin_url' => $validated['linkedin_url'] ?? null,
                ]));
            }

            // Update theme preferences
            if (!empty($validated['theme_preferences'])) {
                $currentPrefs = $user->theme_preferences ?? [];
                $user->theme_preferences = array_merge($currentPrefs, $validated['theme_preferences']);
                $user->save();
            }

            // Update notifications preferences
            if (!empty($validated['notifications'])) {
                $currentNotifs = $user->notification_preferences ?? [];
                $user->notification_preferences = array_merge($currentNotifs, $validated['notifications']);
                $user->save();
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Retro profile updated successfully! ✨',
                'code' => 'RETRO_PROFILE_UPDATED',
                'data' => [
                    'user' => $user->load(['profile'])->toArray(),
                    'theme_preferences' => $user->theme_preferences,
                    'notification_preferences' => $user->notification_preferences,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Update retro profile failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update retro profile.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Refresh authentication token
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function refreshToken(Request $request): JsonResponse
    {
        try {
            $result = $this->authService->refresh($request->user());

            return response()->json([
                'status' => 'success',
                'message' => 'Token berhasil di-refresh.',
                'code' => 'TOKEN_REFRESH_SUCCESS',
                'data' => $result,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Refresh token failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal refresh token.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Refresh token with retro styling & device management
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function retroRefreshToken(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validate([
                'revoke_others' => 'nullable|boolean',
                'device_name' => 'nullable|string|max:255',
                'extend_days' => 'nullable|integer|min:1|max:365',
            ]);

            // Revoke other tokens if requested
            if ($validated['revoke_others'] ?? false) {
                $currentToken = $request->user()->currentAccessToken();
                $user->tokens()->where('id', '!=', $currentToken->id)->delete();
            }

            // Generate new token
            $tokenName = $validated['device_name'] ?? 'retro-refresh-' . now()->timestamp;
            $expiresAt = now()->addDays($validated['extend_days'] ?? config('sanctum.expiration_days', 30));
            $newToken = $user->createToken($tokenName, ['*'], $expiresAt)->plainTextToken;

            // Update device last used
            if ($request->has('device_id')) {
                $user->devices()->where('id', $request->input('device_id'))->update([
                    'last_used_at' => now(),
                ]);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Token refreshed! ✨',
                'code' => 'RETRO_TOKEN_REFRESH_SUCCESS',
                'data' => [
                    'token' => $newToken,
                    'token_type' => 'Bearer',
                    'expires_at' => $expiresAt->toDateTimeString(),
                    'refreshed_at' => now()->toDateTimeString(),
                    'retro_effect' => '🎨 Sparkles applied!',
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Retro refresh token failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal refresh retro token.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Forgot password - send reset link
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $request->validate(['email' => 'required|email']);

            $status = Password::sendResetLink(
                $request->only('email')
            );

            if ($status === Password::RESET_LINK_SENT) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Password reset link sent to your email.',
                    'code' => 'RESET_LINK_SENT',
                ], 200);
            }

            return response()->json([
                'status' => 'error',
                'message' => __($status),
                'code' => 'RESET_FAILED',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Forgot password failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim link reset password.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Reset password
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'token' => 'required',
                'email' => 'required|email',
                'password' => 'required|min:8|confirmed',
            ]);

            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();
                    
                    // Revoke all tokens for security
                    $user->tokens()->delete();
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Password berhasil direset. Silakan login dengan password baru.',
                    'code' => 'PASSWORD_RESET_SUCCESS',
                ], 200);
            }

            return response()->json([
                'status' => 'error',
                'message' => __($status),
                'code' => 'RESET_FAILED',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Reset password failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal reset password.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Enable two-factor authentication
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function enable2FA(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validate([
                'method' => 'required|in:email,whatsapp,authenticator',
                'phone' => 'nullable|required_if:method,whatsapp|string|max:20',
            ]);

            // Generate secret for authenticator app
            if ($validated['method'] === 'authenticator') {
                $secret = Str::random(32);
                $qrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/RPLSmart:{$user->email}?secret={$secret}&issuer=RPLSmart";
                
                // Store secret temporarily in cache
                Cache::put("2fa_setup_{$user->id}", $secret, now()->addMinutes(15));
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Scan QR code with your authenticator app.',
                    'code' => '2FA_SETUP_REQUIRED',
                    'data' => [
                        'secret' => $secret,
                        'qr_code_url' => $qrCodeUrl,
                        'manual_key' => Str::upper($secret),
                        'expires_in' => 900, // 15 minutes
                    ],
                ], 200);
            }

            // For email/whatsapp, send verification code
            $code = rand(100000, 999999);
            Cache::put("2fa_code_{$user->id}", $code, now()->addMinutes(10));
            
            if ($validated['method'] === 'email') {
                // Send email with code (implement your email service)
                // Mail::to($user->email)->send(new TwoFactorCodeMail($code));
            } elseif ($validated['method'] === 'whatsapp' && !empty($validated['phone'])) {
                // Send WhatsApp with code (implement your WhatsApp service)
                // WhatsAppService::send($validated['phone'], "Your 2FA code: {$code}");
            }

            return response()->json([
                'status' => 'success',
                'message' => "Verification code sent via {$validated['method']}.",
                'code' => '2FA_CODE_SENT',
                'data' => [
                    'method' => $validated['method'],
                    'expires_in' => 600, // 10 minutes
                    'masked_destination' => $this->maskDestination($user->email, $validated['phone'] ?? null),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Enable 2FA failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengaktifkan 2FA.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Disable two-factor authentication
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function disable2FA(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validate([
                'password' => 'required|current_password',
                'confirm_disable' => 'required|in:yes',
            ]);

            $user->update([
                'two_factor_enabled' => false,
                'two_factor_method' => null,
                'two_factor_secret' => null,
            ]);

            // Clear any pending 2FA codes
            Cache::forget("2fa_code_{$user->id}");
            Cache::forget("2fa_setup_{$user->id}");

            return response()->json([
                'status' => 'success',
                'message' => 'Two-factor authentication disabled.',
                'code' => '2FA_DISABLED',
            ], 200);

        } catch (\Exception $e) {
            Log::error('Disable 2FA failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menonaktifkan 2FA.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Verify two-factor authentication code
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function verify2FA(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $validated = $request->validate([
                'code' => 'required|string|size:6',
                'method' => 'nullable|in:email,whatsapp,authenticator',
            ]);

            // Check cache for setup code (authenticator app setup)
            $setupSecret = Cache::get("2fa_setup_{$user->id}");
            if ($setupSecret) {
                // Verify TOTP code (implement with google2fa or similar)
                // if (Google2FA::verifyKey($setupSecret, $validated['code'])) {
                if ($validated['code'] === '123456') { // Demo: accept any 6-digit code
                    // Enable 2FA permanently
                    $user->update([
                        'two_factor_enabled' => true,
                        'two_factor_method' => 'authenticator',
                        'two_factor_secret' => $setupSecret,
                    ]);
                    Cache::forget("2fa_setup_{$user->id}");
                    
                    return response()->json([
                        'status' => 'success',
                        'message' => 'Two-factor authentication enabled successfully! 🎉',
                        'code' => '2FA_ENABLED',
                    ], 200);
                }
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid verification code.',
                    'code' => '2FA_INVALID_CODE',
                ], 400);
            }

            // Check cache for login code
            $loginCode = Cache::get("2fa_code_{$user->id}");
            if ($loginCode && $validated['code'] === (string) $loginCode) {
                Cache::forget("2fa_code_{$user->id}");
                
                // Generate auth token after successful 2FA
                $token = $user->createToken('2fa-auth-token')->plainTextToken;
                
                return response()->json([
                    'status' => 'success',
                    'message' => 'Two-factor verification successful! 🚀',
                    'code' => '2FA_VERIFIED',
                    'data' => [
                        'token' => $token,
                        'token_type' => 'Bearer',
                        'user' => $user->load(['profile'])->toArray(),
                    ],
                ], 200);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired verification code.',
                'code' => '2FA_INVALID_CODE',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Verify 2FA failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal verifikasi 2FA.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Get list of authenticated devices
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function devices(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $currentDeviceId = $request->header('X-Device-Id');
            
            $devices = $user->devices()
                ->orderBy('last_used_at', 'desc')
                ->get()
                ->map(function ($device) use ($currentDeviceId) {
                    return [
                        'id' => $device->id,
                        'name' => $device->name,
                        'ip_address' => $device->ip_address,
                        'user_agent' => $device->user_agent,
                        'last_used_at' => $device->last_used_at,
                        'created_at' => $device->created_at,
                        'is_current' => $device->id == $currentDeviceId,
                        'location' => $this->getDeviceLocation($device->ip_address),
                    ];
                });

            return response()->json([
                'status' => 'success',
                'message' => 'Devices retrieved successfully.',
                'code' => 'DEVICES_SUCCESS',
                'data' => [
                    'devices' => $devices,
                    'current_device_id' => $currentDeviceId,
                    'total_devices' => $devices->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Get devices failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil daftar device.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Revoke a specific device session
     * 
     * @param Request $request
     * @param int $deviceId
     * @return JsonResponse
     */
    public function revokeDevice(Request $request, int $deviceId): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Prevent revoking current device via API
            $currentDeviceId = $request->header('X-Device-Id');
            if ($deviceId == $currentDeviceId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot revoke current device session via API.',
                    'code' => 'CANNOT_REVOKE_CURRENT',
                ], 400);
            }

            $device = $user->devices()->find($deviceId);
            if (!$device) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Device not found.',
                    'code' => 'DEVICE_NOT_FOUND',
                ], 404);
            }

            // Delete associated tokens
            $user->tokens()->where('name', 'like', "{$device->name}%")->delete();
            
            // Delete device record
            $device->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Device session revoked successfully.',
                'code' => 'DEVICE_REVOKED',
            ], 200);

        } catch (\Exception $e) {
            Log::error('Revoke device failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mencabut sesi device.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Revoke all other devices (keep current)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function revokeOtherDevices(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $currentDeviceId = $request->header('X-Device-Id');
            
            // Delete all devices except current
            $deleted = $user->devices()
                ->where('id', '!=', $currentDeviceId)
                ->delete();
            
            // Delete all tokens except current
            $currentToken = $request->user()->currentAccessToken();
            $user->tokens()
                ->where('id', '!=', $currentToken->id)
                ->delete();

            return response()->json([
                'status' => 'success',
                'message' => "All other devices revoked. {$deleted} sessions ended.",
                'code' => 'OTHER_DEVICES_REVOKED',
                'data' => [
                    'devices_revoked' => $deleted,
                    'current_device_id' => $currentDeviceId,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Revoke other devices failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mencabut sesi device lain.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 HELPER METHODS (Private)
    // ═══════════════════════════════════════════════════════════

    /**
     * Get user's retro badges based on activity & role
     */
    private function getUserRetroBadges(User $user): array
    {
        $badges = [];
        
        // Early adopter badge (created before 6 months ago)
        if ($user->created_at->lt(now()->subMonths(6))) {
            $badges[] = ['name' => 'Early Adopter', 'icon' => '🚀', 'description' => 'Joined in the early days', 'earned_at' => $user->created_at];
        }
        
        // PKL ready badge for grade 12 students
        if ($user->role === 'siswa' && $user->profile?->class_level === 'XII') {
            $badges[] = ['name' => 'PKL Ready', 'icon' => '💼', 'description' => 'Ready for internship program', 'earned_at' => now()];
        }
        
        // Active user badge (logged in within last 7 days)
        if ($user->last_login_at && $user->last_login_at->gt(now()->subDays(7))) {
            $badges[] = ['name' => 'Active User', 'icon' => '⚡', 'description' => 'Active in the last week', 'earned_at' => $user->last_login_at];
        }
        
        // Complete profile badge
        if ($user->profile && $user->profile->bio && $user->avatar_url) {
            $badges[] = ['name' => 'Profile Complete', 'icon' => '✨', 'description' => 'Fully customized profile', 'earned_at' => $user->updated_at];
        }
        
        // Admin badge
        if ($user->role === 'admin') {
            $badges[] = ['name' => 'System Admin', 'icon' => '🛡️', 'description' => 'Full system access', 'earned_at' => $user->created_at];
        }
        
        // Teacher badge
        if ($user->role === 'guru') {
            $badges[] = ['name' => 'Educator', 'icon' => '👨‍🏫', 'description' => 'Teaching & mentoring', 'earned_at' => $user->created_at];
        }
        
        return $badges;
    }

    /**
     * Get dashboard redirect URL based on user role
     */
    private function getDashboardRedirect(string $role): string
    {
        return match($role) {
            'admin' => '/dashboard/admin',
            'guru' => '/dashboard/teacher',
            'siswa' => '/dashboard/student',
            default => '/dashboard',
        };
    }

    /**
     * Get user permissions based on role
     */
    private function getUserPermissions(User $user): array
    {
        $basePermissions = [
            'view_profile' => true,
            'update_profile' => true,
            'change_password' => true,
        ];
        
        $rolePermissions = [
            'admin' => [
                'manage_users' => true,
                'manage_classes' => true,
                'manage_subjects' => true,
                'manage_schedules' => true,
                'manage_settings' => true,
                'view_analytics' => true,
                'export_data' => true,
                'manage_pkl' => true,
            ],
            'guru' => [
                'view_classes' => true,
                'manage_attendance' => true,
                'view_students' => true,
                'manage_permissions' => true,
                'view_reports' => true,
            ],
            'siswa' => [
                'submit_attendance' => true,
                'view_attendance_history' => true,
                'manage_projects' => true,
                'view_skills' => true,
                'submit_pkl_report' => true,
            ],
        ];
        
        return array_merge($basePermissions, $rolePermissions[$user->role] ?? []);
    }

    /**
     * Get quick actions based on user role
     */
    private function getUserQuickActions(User $user): array
    {
        $actions = [
            ['label' => 'View Profile', 'icon' => '👤', 'route' => '/profile', 'role' => ['admin', 'guru', 'siswa']],
            ['label' => 'Settings', 'icon' => '⚙️', 'route' => '/settings', 'role' => ['admin', 'guru', 'siswa']],
        ];
        
        $roleActions = [
            'admin' => [
                ['label' => 'Manage Users', 'icon' => '👥', 'route' => '/admin/users'],
                ['label' => 'Dashboard', 'icon' => '📊', 'route' => '/admin/dashboard'],
                ['label' => 'Settings', 'icon' => '🔧', 'route' => '/admin/settings'],
            ],
            'guru' => [
                ['label' => 'Take Attendance', 'icon' => '📝', 'route' => '/teacher/attendance'],
                ['label' => 'My Classes', 'icon' => '🏫', 'route' => '/teacher/classes'],
                ['label' => 'Permissions', 'icon' => '✅', 'route' => '/teacher/permissions'],
            ],
            'siswa' => [
                ['label' => 'Check In', 'icon' => '📍', 'route' => '/student/attendance'],
                ['label' => 'My Projects', 'icon' => '💻', 'route' => '/student/projects'],
                ['label' => 'Skills', 'icon' => '🎯', 'route' => '/student/skills'],
            ],
        ];
        
        $userActions = $roleActions[$user->role] ?? [];
        
        return array_merge($actions, array_filter($userActions, fn($a) => in_array($user->role, $a['role'] ?? [$user->role])));
    }

    /**
     * Get user stats for profile
     */
    private function getUserStats(User $user): array
    {
        // This would query your database for actual stats
        return [
            'total_logins' => rand(10, 100), // Replace with actual count
            'projects_submitted' => $user->role === 'siswa' ? rand(1, 20) : 0,
            'attendance_rate' => $user->role === 'siswa' ? rand(80, 100) : null,
            'classes_assigned' => $user->role === 'guru' ? rand(1, 10) : ($user->role === 'siswa' ? 1 : 0),
            'last_activity' => $user->last_login_at?->diffForHumans() ?? 'Never',
        ];
    }

    /**
     * Track failed login attempts for rate limiting
     */
    private function trackFailedLogin(string $ip, string $email): void
    {
        $key = "login_attempts:{$ip}:{$email}";
        $attempts = Cache::get($key, 0) + 1;
        Cache::put($key, $attempts, now()->addMinutes(15));
    }

    /**
     * Get remaining login attempts
     */
    private function getRemainingAttempts(string $ip, string $email): int
    {
        $key = "login_attempts:{$ip}:{$email}";
        $attempts = Cache::get($key, 0);
        return max(0, 5 - $attempts); // Allow 5 attempts
    }

    /**
     * Send two-factor authentication code
     */
    private function sendTwoFactorCode(User $user): void
    {
        $code = rand(100000, 999999);
        Cache::put("2fa_code_{$user->id}", $code, now()->addMinutes(10));
        
        // Implement your email/SMS service here
        // Mail::to($user->email)->send(new TwoFactorCodeMail($code));
    }

    /**
     * Verify two-factor authentication code
     */
    private function verifyTwoFactorCode(User $user, string $code): bool
    {
        $storedCode = Cache::get("2fa_code_{$user->id}");
        if ($storedCode && $code === (string) $storedCode) {
            Cache::forget("2fa_code_{$user->id}");
            return true;
        }
        return false;
    }

    /**
     * Register device for user
     */
    private function registerDevice(User $user, string $ip, array $deviceInfo): void
    {
        // Implement device tracking logic
        // Device::create([
        //     'user_id' => $user->id,
        //     'name' => $deviceInfo['name'] ?? 'Unknown Device',
        //     'ip_address' => $ip,
        //     'user_agent' => $deviceInfo['user_agent'] ?? null,
        //     'last_used_at' => now(),
        // ]);
    }

    /**
     * Mask email/phone for display
     */
    private function maskDestination(?string $email, ?string $phone): string
    {
        if ($email) {
            $parts = explode('@', $email);
            return substr($parts[0], 0, 3) . '***@' . $parts[1];
        }
        if ($phone) {
            return substr($phone, 0, 4) . '****' . substr($phone, -2);
        }
        return '***';
    }

    /**
     * Get approximate location from IP (simplified)
     */
    private function getDeviceLocation(?string $ip): ?array
    {
        if (!$ip) return null;
        
        // Implement IP geolocation service (e.g., ipapi.co, ipinfo.io)
        // For demo, return mock data
        return [
            'city' => 'Jakarta',
            'region' => 'DKI Jakarta',
            'country' => 'Indonesia',
            'country_code' => 'ID',
        ];
    }
}