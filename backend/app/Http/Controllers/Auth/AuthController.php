<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    /**
     * Constructor dengan Dependency Injection
     */
    public function __construct(protected AuthService $authService)
    {
        //
    }

    /**
     * Login user
     * 
     * @param LoginRequest $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'LOGIN_FAILED',
            ], 401);
        }

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
    }

    /**
     * Register new user
     * 
     * @param RegisterRequest $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'REGISTRATION_FAILED',
                'errors' => $result['errors'] ?? null,
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'REGISTRATION_SUCCESS',
            'data' => [
                'user' => [
                    'id' => $result['user']->id,
                    'name' => $result['user']->name,
                    'email' => $result['user']->email,
                    'role' => $result['user']->role,
                ],
            ],
        ], 201);
    }

    /**
     * Logout user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil.',
            'code' => 'LOGOUT_SUCCESS',
        ], 200);
    }

    /**
     * Get current user profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        $profile = $this->authService->profile($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diambil.',
            'code' => 'PROFILE_SUCCESS',
            'data' => $profile,
        ], 200);
    }

    /**
     * Update user profile
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateProfile(Request $request): JsonResponse
    {
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
    }

    /**
     * Refresh authentication token
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $result = $this->authService->refresh($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Token berhasil di-refresh.',
            'code' => 'TOKEN_REFRESH_SUCCESS',
            'data' => $result,
        ], 200);
    }

    /**
     * Reset user password (admin)
     * 
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function resetPassword(Request $request, int $userId): JsonResponse
    {
        $user = $this->authService->findById($userId);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $result = $this->authService->resetPassword(
            $user,
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
}