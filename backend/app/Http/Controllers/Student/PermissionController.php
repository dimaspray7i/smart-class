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

        // Map items to include teacher info safely
        $items = collect($permissions->items())->map(function ($p) {
            return [
                'id'             => $p->id,
                'type'           => $p->type,
                'reason'         => $p->reason,
                'date_from'      => $p->date_from?->toDateString(),
                'date_to'        => $p->date_to?->toDateString(),
                'status'         => $p->status,
                'note'           => $p->note,
                'attachment_url' => $p->attachment_url,
                'approved_at'    => $p->approved_at?->toDateTimeString(),
                'created_at'     => $p->created_at?->toDateTimeString(),
                'teacher'        => $p->teacher ? [
                    'id'         => $p->teacher->id,
                    'name'       => $p->teacher->name,
                    'avatar_url' => $p->teacher->avatar_url,
                ] : null,
            ];
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Riwayat izin berhasil diambil.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $permissions->currentPage(),
                'last_page'    => $permissions->lastPage(),
                'total'        => $permissions->total(),
                'per_page'     => $permissions->perPage(),
            ],
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'      => 'required|in:Izin,Sakit,izin,sakit',
            'reason'    => 'required|string|max:500',
            'date_from' => 'required|date',
            'date_to'   => 'required|date|after_or_equal:date_from',
            'file'      => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
        ]);

        $user = $request->user();

        // Cari teacher (wali kelas) dengan fallback
        $teacherId = $this->resolveTeacherId($user);

        $filePath = null;
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('permissions/' . $user->id, 'public');
        }

        // Standardize type to TitleCase (Izin / Sakit)
        $type = ucfirst(strtolower($validated['type']));

        $permission = Permission::create([
            'user_id'        => $user->id,
            'teacher_id'     => $teacherId,   // bisa null jika tidak ada wali kelas
            'date_from'      => $validated['date_from'],
            'date_to'        => $validated['date_to'],
            'type'           => $type,
            'reason'         => $validated['reason'],
            'attachment_url' => $filePath ? Storage::url($filePath) : null,
            'status'         => 'pending',
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengajuan izin berhasil dikirim.' . ($teacherId ? '' : ' (Belum ada wali kelas yang ditugaskan.)'),
            'data'    => $permission,
        ], 201);
    }

    /**
     * Resolve teacher_id dari wali kelas dengan multi-level fallback.
     */
    private function resolveTeacherId($user): ?int
    {
        // Coba method getCurrentClass yang sudah ada
        try {
            $studentClass = $user->getCurrentClass();
            if ($studentClass) {
                $waliKelas = $studentClass->wali_kelas;
                if ($waliKelas) return $waliKelas->id;

                // Fallback: guru pertama di kelas
                $firstTeacher = $studentClass->teachers()->first();
                if ($firstTeacher) return $firstTeacher->id;
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('PermissionController: gagal resolve teacher_id', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
        }

        // Coba tanpa filter academic_year
        try {
            $studentClass = $user->classes()
                ->wherePivot('is_active', true)
                ->wherePivot('role_in_class', 'siswa')
                ->first();

            if ($studentClass) {
                $waliKelas = $studentClass->wali_kelas;
                if ($waliKelas) return $waliKelas->id;
            }
        } catch (\Throwable $e) {
            // silent
        }

        return null;
    }
}
