<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MaterialController extends Controller
{
    /**
     * List materials created by this teacher
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $type = $request->query('type');

            $query = Material::with(['class', 'subject'])
                ->where('teacher_id', $teacherId);

            if ($type && $type !== 'all') {
                $query->where('type', $type);
            }

            $list = $query->orderByDesc('created_at')->get();

            return response()->json([
                'status' => 'success',
                'data' => $list
            ], 200);

        } catch (\Exception $e) {
            Log::error('MaterialController::index failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat materi.',
                'code' => 'SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Create material/assignment
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title'       => 'required|string|max:255',
                'description' => 'nullable|string',
                'type'        => 'required|in:document,video,link,assignment',
                'class_id'    => 'nullable|exists:classes,id',
                'subject_id'  => 'nullable|exists:subjects,id',
                'url'         => 'nullable|string|url|max:255',
                'deadline'    => 'nullable|date',
            ]);

            $material = Material::create([
                'teacher_id'  => $request->user()->id,
                'title'       => $validated['title'],
                'description' => $validated['description'] ?? null,
                'type'        => $validated['type'],
                'class_id'    => $validated['class_id'] ?: null,
                'subject_id'  => $validated['subject_id'] ?: null,
                'url'         => $validated['url'] ?? null,
                'deadline'    => $validated['deadline'] ?? null,
            ]);

            // Load relations to return consistent object structure
            $material->load(['class', 'subject']);

            return response()->json([
                'status' => 'success',
                'message' => 'Materi berhasil ditambahkan.',
                'data' => $material
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('MaterialController::store failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan materi.',
                'code' => 'SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Delete material
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $material = Material::where('id', $id)
                ->where('teacher_id', $request->user()->id)
                ->first();

            if (!$material) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Materi tidak ditemukan atau Anda tidak memiliki akses.',
                    'code' => 'NOT_FOUND'
                ], 404);
            }

            $material->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Materi berhasil dihapus.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('MaterialController::destroy failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus materi.',
                'code' => 'SERVER_ERROR'
            ], 500);
        }
    }
}
