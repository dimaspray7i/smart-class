<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(protected AuthService $authService)
    {
        //
    }

    /**
     * Login user
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
     * Logout user
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
}