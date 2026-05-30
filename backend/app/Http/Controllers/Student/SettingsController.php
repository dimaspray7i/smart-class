<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'status' => 'success',
            'data' => [
                'theme' => $user->theme_preferences ?? ['mode' => 'light'],
                'notifications' => $user->notification_preferences ?? [],
            ]
        ], 200);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'theme' => 'sometimes|array',
            'notifications' => 'sometimes|array',
        ]);

        if (isset($validated['theme'])) {
            $user->update(['theme_preferences' => array_merge($user->theme_preferences ?? [], $validated['theme'])]);
        }

        if (isset($validated['notifications'])) {
            $user->update(['notification_preferences' => array_merge($user->notification_preferences ?? [], $validated['notifications'])]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan berhasil disimpan.',
            'data' => [
                'theme' => $user->fresh()->theme_preferences,
                'notifications' => $user->fresh()->notification_preferences,
            ]
        ], 200);
    }
}
