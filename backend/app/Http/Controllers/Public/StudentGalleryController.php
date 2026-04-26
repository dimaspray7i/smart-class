<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\StudentGalleryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentGalleryController extends Controller
{
    public function __construct(protected StudentGalleryService $galleryService)
    {
        //
    }

    /**
     * Get student gallery with filters
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $classLevel = $request->query('class_level');
        
        // Check feature flag
        if (!config('app.feature_enable_gallery_public', true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Galeri siswa sedang tidak tersedia.',
                'code' => 'FEATURE_DISABLED',
            ], 503);
        }

        $students = $this->galleryService->getGallery($classLevel);

        return response()->json([
            'status' => 'success',
            'message' => 'Galeri siswa berhasil diambil.',
            'code' => 'GALLERY_SUCCESS',
            'data' => $students,
            'meta' => [
                'current_page' => $students->currentPage(),
                'per_page' => $students->perPage(),
                'total' => $students->total(),
                'last_page' => $students->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get student detail by slug
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function show(string $slug): JsonResponse
    {
        $student = $this->galleryService->findBySlug($slug);

        if (!$student) {
            return response()->json([
                'status' => 'error',
                'message' => 'Siswa tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail siswa berhasil diambil.',
            'code' => 'STUDENT_SUCCESS',
            'data' => $student,
        ], 200);
    }

    /**
     * Get gallery statistics
     * 
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Statistik galeri berhasil diambil.',
            'code' => 'GALLERY_STATS_SUCCESS',
            'data' => $this->galleryService->getStats(),
        ], 200);
    }
}