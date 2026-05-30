<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Permission;
use Illuminate\Support\Facades\Storage;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $permissions = Permission::where('user_id', $user->id)
            ->with(['teacher:id,name,avatar_url'])
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat izin berhasil diambil.',
            'data' => $permissions->items(),
            'meta' => [
                'current_page' => $permissions->currentPage(),
                'last_page' => $permissions->lastPage(),
                'total' => $permissions->total(),
                'per_page' => $permissions->perPage(),
            ]
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:Izin,Sakit,izin,sakit',
            'reason' => 'required|string|max:500',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'file' => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
        ]);

        $user = $request->user();
        $studentClass = $user->getCurrentClass();
        $waliKelas = $studentClass ? $studentClass->wali_kelas : null;
        $teacherId = $waliKelas ? $waliKelas->id : null;

        // In case there is no wali kelas, we can look for any teacher in class or leave it null
        if (!$teacherId && $studentClass) {
            $firstTeacher = $studentClass->teachers()->first();
            $teacherId = $firstTeacher ? $firstTeacher->id : null;
        }

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('permissions/' . $user->id, 'public');
        }

        // Standardize type to titlecase as in Indonesian Labels
        $type = ucfirst(strtolower($validated['type'])); // 'Izin' or 'Sakit'

        $permission = Permission::create([
            'user_id' => $user->id,
            'teacher_id' => $teacherId,
            'date_from' => $validated['date_from'],
            'date_to' => $validated['date_to'],
            'type' => $type,
            'reason' => $validated['reason'],
            'attachment_url' => $filePath ? Storage::url($filePath) : null,
            'status' => 'pending',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengajuan izin berhasil dikirim.',
            'data' => $permission
        ], 201);
    }
}
