<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function __construct(protected AnalyticsService $analyticsService)
    {
        // Middleware will handle auth & role checks
    }

    /**
     * Get general analytics data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $params = $request->only(['start_date', 'end_date', 'metric', 'group_by']);
        
        // Cache analytics for 5 minutes to reduce DB load
        $cacheKey = 'analytics_' . md5(json_encode($params));
        $analytics = Cache::remember($cacheKey, 300, function () use ($params) {
            return $this->analyticsService->getAnalytics($params);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics berhasil diambil.',
            'code' => 'ANALYTICS_SUCCESS',
            'data' => $analytics,
            'meta' => [
                'cached' => Cache::has($cacheKey),
                'generated_at' => now()->toDateTimeString(),
            ],
        ], 200);
    }

    /**
     * Get attendance-specific analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function attendanceAnalytics(Request $request): JsonResponse
    {
        $params = array_merge(
            $request->only(['start_date', 'end_date', 'class_id', 'teacher_id']),
            ['metric' => 'attendance']
        );
        
        $analytics = $this->analyticsService->getAttendanceAnalytics($params);

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics absensi berhasil diambil.',
            'code' => 'ATTENDANCE_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Get student-specific analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function studentAnalytics(Request $request): JsonResponse
    {
        $params = array_merge(
            $request->only(['start_date', 'end_date', 'class_level', 'role']),
            ['metric' => 'students']
        );
        
        $analytics = $this->analyticsService->getStudentAnalytics($params);

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics siswa berhasil diambil.',
            'code' => 'STUDENT_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Get class-specific analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function classAnalytics(Request $request): JsonResponse
    {
        $params = array_merge(
            $request->only(['start_date', 'end_date', 'class_id']),
            ['metric' => 'classes']
        );
        
        $analytics = $this->analyticsService->getClassAnalytics($params);

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics kelas berhasil diambil.',
            'code' => 'CLASS_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Get subject-specific analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function subjectAnalytics(Request $request): JsonResponse
    {
        $params = array_merge(
            $request->only(['start_date', 'end_date', 'subject_id', 'category']),
            ['metric' => 'subjects']
        );
        
        $analytics = $this->analyticsService->getSubjectAnalytics($params);

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics mata pelajaran berhasil diambil.',
            'code' => 'SUBJECT_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Get PKL/internship analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function pklAnalytics(Request $request): JsonResponse
    {
        $params = array_merge(
            $request->only(['start_date', 'end_date', 'company_id', 'status']),
            ['metric' => 'pkl']
        );
        
        $analytics = $this->analyticsService->getPklAnalytics($params);

        return response()->json([
            'status' => 'success',
            'message' => 'Analytics PKL berhasil diambil.',
            'code' => 'PKL_ANALYTICS_SUCCESS',
            'data' => $analytics,
        ], 200);
    }

    /**
     * Export analytics data to CSV
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function export(Request $request)
    {
        $params = $request->only(['start_date', 'end_date', 'metric', 'format']);
        $format = $params['format'] ?? 'csv';
        
        $data = $this->analyticsService->getAnalytics($params);
        
        if ($format === 'csv') {
            return $this->exportToCsv($data, 'analytics_export');
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Export ready.',
            'data' => $data,
        ], 200);
    }

    /**
     * Helper: Export to CSV
     */
    private function exportToCsv(array $data, string $filename): \Illuminate\Http\Response
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}_" . date('Y-m-d') . ".csv\"",
        ];
        
        $callback = function() use ($data) {
            $file = fopen('php://output', 'w');
            
            // Write headers
            if (!empty($data['summary'])) {
                fputcsv($file, ['=== SUMMARY ===']);
                foreach ($data['summary'] as $key => $value) {
                    fputcsv($file, [$key, $value]);
                }
                fputcsv($file, []);
            }
            
            // Write daily data if exists
            if (!empty($data['daily'])) {
                fputcsv($file, ['=== DAILY DATA ===']);
                fputcsv($file, array_keys($data['daily'][0] ?? []));
                foreach ($data['daily'] as $row) {
                    fputcsv($file, $row);
                }
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}