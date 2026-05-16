<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminService;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Constructor with dependency injection
     * 
     * @param AdminService $adminService
     * @param AnalyticsService $analyticsService
     */
    public function __construct(
        protected AdminService $adminService,
        protected AnalyticsService $analyticsService
    ) {
        // Middleware for auth & role checks should be applied in routes/api.php
        // Example: Route::middleware(['auth:sanctum', 'role:admin'])->group(...)
    }

    /**
     * Get admin dashboard data
     * 
     * This endpoint returns comprehensive dashboard data including:
     * - Overview statistics (users, classes, subjects, attendance)
     * - System health status (database, cache, queue, storage)
     * - Recent activity (new users, recent attendance)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $result = $this->adminService->getDashboardData();

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'DASHBOARD_FAILED',
            ], 500);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Dashboard admin berhasil diambil.',
            'code' => 'DASHBOARD_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }

    /**
     * Get analytics data (general)
     * 
     * @param Request $request
     * @return JsonResponse
     * 
     * @deprecated Use AnalyticsController@index instead
     * @see AnalyticsController::index()
     */
    public function analytics(Request $request): JsonResponse
    {
        $analytics = $this->analyticsService->getAnalytics(
            $request->only(['start_date', 'end_date', 'metric'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics berhasil diambil.',
            'code' => 'ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Get attendance analytics specifically
     * 
     * @param Request $request
     * @return JsonResponse
     * 
     * @deprecated Use AnalyticsController::attendanceAnalytics instead
     * @see AnalyticsController::attendanceAnalytics()
     */
    public function attendanceAnalytics(Request $request): JsonResponse
    {
        $analytics = $this->analyticsService->getAnalytics(
            array_merge($request->only(['start_date', 'end_date']), ['metric' => 'attendance'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics absensi berhasil diambil.',
            'code' => 'ATTENDANCE_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Get student analytics specifically
     * 
     * @param Request $request
     * @return JsonResponse
     * 
     * @deprecated Use AnalyticsController::studentAnalytics instead
     * @see AnalyticsController::studentAnalytics()
     */
    public function studentAnalytics(Request $request): JsonResponse
    {
        $analytics = $this->analyticsService->getAnalytics(
            array_merge($request->only(['start_date', 'end_date']), ['metric' => 'students'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics siswa berhasil diambil.',
            'code' => 'STUDENT_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }
}