<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\TeacherService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(protected TeacherService $teacherService)
    {
        //
    }

    /**
     * Get teacher dashboard data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $teacherId = $request->user()->id;

        $result = $this->teacherService->getDashboardData($teacherId);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'DASHBOARD_FAILED',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Dashboard guru berhasil diambil.',
            'code' => 'DASHBOARD_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }
}