<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AnnouncementController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $announcements = Announcement::orderByDesc('is_pinned')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Daftar pengumuman berhasil dimuat.',
                'data' => $announcements,
            ], 200);
        } catch (\Exception $e) {
            Log::error('AdminAnnouncementController::index', ['error' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat pengumuman.',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail pengumuman berhasil dimuat.',
            'data' => $announcement,
        ], 200);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'target' => 'nullable|string|max:50',
            'target_class' => 'nullable|string|max:100',
            'priority' => 'nullable|in:normal,high,urgent',
            'is_pinned' => 'nullable|boolean',
        ]);

        $announcement = Announcement::create([
            'teacher_id' => $request->user()->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'target_class' => $validated['target_class'] ?? $validated['target'] ?? null,
            'priority' => $validated['priority'] ?? 'normal',
            'is_pinned' => $validated['is_pinned'] ?? false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengumuman berhasil dibuat.',
            'data' => $announcement,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'target' => 'nullable|string|max:50',
            'target_class' => 'nullable|string|max:100',
            'priority' => 'nullable|in:normal,high,urgent',
            'is_pinned' => 'nullable|boolean',
        ]);

        $announcement->update([
            'title' => $validated['title'] ?? $announcement->title,
            'content' => $validated['content'] ?? $announcement->content,
            'target_class' => $validated['target_class'] ?? $validated['target'] ?? $announcement->target_class,
            'priority' => $validated['priority'] ?? $announcement->priority,
            'is_pinned' => $validated['is_pinned'] ?? $announcement->is_pinned,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengumuman berhasil diperbarui.',
            'data' => $announcement,
        ], 200);
    }

    public function destroy(int $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pengumuman berhasil dihapus.',
        ], 200);
    }

    public function pin(int $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (!$announcement) {
            return response()->json([
                'status' => 'error',
                'message' => 'Pengumuman tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $announcement->update(['is_pinned' => !$announcement->is_pinned]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status semat diperbarui.',
            'data' => $announcement,
        ], 200);
    }
}
