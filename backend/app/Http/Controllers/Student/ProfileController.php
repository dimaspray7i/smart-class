<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile', 'classes']);
        $currentClass = $user->getCurrentClass();
        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diambil.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar_url' => $user->avatar_url,
                'role' => $user->role,
                'nis' => $user->profile?->nis,
                'address' => $user->profile?->address,
                'bio' => $user->profile?->bio,
                'github_url' => $user->profile?->github_url,
                'linkedin_url' => $user->profile?->linkedin_url,
                'gender' => $user->profile?->gender,
                'date_of_birth' => $user->profile?->date_of_birth,
                'class_level' => $user->profile?->class_level,
                'class' => $currentClass ? ['id' => $currentClass->id, 'name' => $currentClass->name] : null,
                'created_at' => $user->created_at,
            ]
        ], 200);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
            'bio' => 'sometimes|nullable|string|max:1000',
            'github_url' => 'sometimes|nullable|string|max:255',
            'linkedin_url' => 'sometimes|nullable|string|max:255',
            'gender' => 'sometimes|nullable|string|in:L,P',
            'date_of_birth' => 'sometimes|nullable|date',
        ]);

        $user->update(array_filter([
            'name' => $validated['name'] ?? null,
            'phone' => $validated['phone'] ?? null,
        ], fn($v) => !is_null($v)));

        $profileData = array_filter([
            'address' => $validated['address'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'github_url' => $validated['github_url'] ?? null,
            'linkedin_url' => $validated['linkedin_url'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
        ], fn($v) => !is_null($v));

        if ($user->profile) {
            $user->profile->update($profileData);
        } else {
            $user->profile()->create($profileData);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user->fresh()->load('profile')
        ], 200);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate(['avatar' => 'required|image|max:2048|mimes:jpg,jpeg,png,webp']);
        $user = $request->user();
        
        // Delete old avatar
        $oldPath = $user->getRawOriginal('avatar_url');
        if ($oldPath && !filter_var($oldPath, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($oldPath);
        }
        
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar_url' => $path]);
        
        return response()->json([
            'status' => 'success',
            'message' => 'Avatar berhasil diperbarui.',
            'data' => ['avatar_url' => $user->avatar_url]
        ], 200);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        $user = $request->user();
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['status' => 'error', 'message' => 'Password saat ini tidak sesuai.'], 422);
        }
        $user->update(['password' => Hash::make($request->password)]);
        return response()->json(['status' => 'success', 'message' => 'Password berhasil diubah.'], 200);
    }
}
