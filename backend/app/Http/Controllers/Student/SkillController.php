<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\SkillService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SkillController extends Controller
{
    public function __construct(protected SkillService $skillService)
    {
        //
    }

    /**
     * Get all skills
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $skills = $this->skillService->getAll($request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Skills berhasil diambil.',
            'code' => 'SKILLS_SUCCESS',
            'data' => $skills,
        ], 200);
    }

    /**
     * Get user's skill progress
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function progress(Request $request): JsonResponse
    {
        $progress = $this->skillService->getProgress($request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Progress skill berhasil diambil.',
            'code' => 'PROGRESS_SUCCESS',
            'data' => $progress,
        ], 200);
    }

    /**
     * Log skill activity
     * 
     * @param Request $request
     * @param int $skill
     * @return JsonResponse
     */
    public function logActivity(Request $request, int $skill): JsonResponse
    {
        $result = $this->skillService->logActivity(
            $request->user()->id,
            $skill,
            $request->validate([
                'hours' => 'required|numeric|min:0.5|max:24',
                'evidence' => 'nullable|string|max:500',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'ACTIVITY_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'ACTIVITY_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }
}