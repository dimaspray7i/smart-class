<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\LandingService;
use Illuminate\Http\JsonResponse;

class LandingController extends Controller
{
    public function __construct(protected LandingService $landingService)
    {
        //
    }

    /**
     * Get landing page data
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Landing page data berhasil diambil.',
            'code' => 'LANDING_SUCCESS',
            'data' => [
                'hero' => $this->landingService->getHeroContent(),
                'features' => $this->landingService->getFeatures(),
                'testimonials' => $this->landingService->getTestimonials(),
                'stats' => $this->landingService->getPublicStats(),
                'recent_projects' => $this->landingService->getRecentProjects(6),
            ],
        ], 200);
    }

    /**
     * Get public statistics only
     * 
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Statistik publik berhasil diambil.',
            'code' => 'STATS_SUCCESS',
            'data' => $this->landingService->getPublicStats(),
        ], 200);
    }
}