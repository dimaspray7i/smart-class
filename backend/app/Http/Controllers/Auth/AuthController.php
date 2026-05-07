<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
        //
    }

    /**
     * Login user - dengan logging & error handling lengkap
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
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $this->authService->logout($request->user());

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
     * Update user profile
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
     * Refresh authentication token
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
}