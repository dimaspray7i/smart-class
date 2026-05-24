<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AnnouncementController extends Controller
{
    /**
     * List announcements created by this teacher
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            // Use announcements table if exists, else return empty
            if (!\Illuminate\Support\Facades\Schema::hasTable('announcements')) {
                return response()->json(['status' => 'success', 'data' => [], 'message' => 'Belum ada pengumuman.'], 200);
            }

            $list = \Illuminate\Support\Facades\DB::table('announcements')
                ->where('teacher_id', $teacherId)
                ->orderByDesc('is_pinned')
                ->orderByDesc('created_at')
                ->get();

            return response()->json(['status' => 'success', 'data' => $list], 200);

        } catch (\Exception $e) {
            Log::error('AnnouncementController::index', ['error' => $e->getMessage()]);
            return response()->json(['status' => 'success', 'data' => []], 200);
        }
    }

    /**
     * Create announcement
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'        => 'required|string|max:255',
                'content'      => 'required|string',
                'target_class' => 'nullable|string|max:100',
                'priority'     => 'nullable|in:normal,high',
                'is_pinned'    => 'nullable|boolean',
            ]);

            if (!\Illuminate\Support\Facades\Schema::hasTable('announcements')) {
                return response()->json(['status' => 'error', 'message' => 'Fitur pengumuman belum diaktifkan.', 'code' => 'FEATURE_UNAVAILABLE'], 503);
            }

            $id = \Illuminate\Support\Facades\DB::table('announcements')->insertGetId([
                'teacher_id'   => $request->user()->id,
                'title'        => $validated['title'],
                'content'      => $validated['content'],
                'target_class' => $validated['target_class'] ?? null,
                'priority'     => $validated['priority'] ?? 'normal',
                'is_pinned'    => $validated['is_pinned'] ?? false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            return response()->json(['status' => 'success', 'message' => 'Pengumuman berhasil dibuat.', 'data' => ['id' => $id]], 201);

        } catch (ValidationException $e) {
            return response()->json(['status' => 'error', 'message' => 'Validasi gagal.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal membuat pengumuman.'], 500);
        }
    }

    /**
     * Update announcement
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('announcements')) {
                return response()->json(['status' => 'error', 'message' => 'Fitur belum tersedia.'], 503);
            }

            $validated = $request->validate([
                'title'        => 'sometimes|string|max:255',
                'content'      => 'sometimes|string',
                'target_class' => 'nullable|string|max:100',
                'priority'     => 'nullable|in:normal,high',
                'is_pinned'    => 'nullable|boolean',
            ]);

            \Illuminate\Support\Facades\DB::table('announcements')
                ->where('id', $id)
                ->where('teacher_id', $request->user()->id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            return response()->json(['status' => 'success', 'message' => 'Pengumuman diperbarui.'], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal memperbarui.'], 500);
        }
    }

    /**
     * Delete announcement
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('announcements')) {
                return response()->json(['status' => 'success'], 200);
            }

            \Illuminate\Support\Facades\DB::table('announcements')
                ->where('id', $id)
                ->where('teacher_id', $request->user()->id)
                ->delete();

            return response()->json(['status' => 'success', 'message' => 'Pengumuman dihapus.'], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal menghapus.'], 500);
        }
    }

    /**
     * Toggle pin announcement
     */
    public function pin(Request $request, int $id): JsonResponse
    {
        try {
            if (!\Illuminate\Support\Facades\Schema::hasTable('announcements')) {
                return response()->json(['status' => 'success'], 200);
            }

            $ann = \Illuminate\Support\Facades\DB::table('announcements')
                ->where('id', $id)->where('teacher_id', $request->user()->id)->first();

            if ($ann) {
                \Illuminate\Support\Facades\DB::table('announcements')
                    ->where('id', $id)
                    ->update(['is_pinned' => !$ann->is_pinned, 'updated_at' => now()]);
            }

            return response()->json(['status' => 'success', 'message' => 'Status pin diperbarui.'], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Gagal.'], 500);
        }
    }
}
