<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\StudentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(protected StudentService $studentService)
    {
        //
    }

    /**
     * Get student dashboard data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $result = $this->studentService->getDashboardData($userId);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'DASHBOARD_FAILED',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Dashboard data berhasil diambil.',
            'code' => 'DASHBOARD_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }
}