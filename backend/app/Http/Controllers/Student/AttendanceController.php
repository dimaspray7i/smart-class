<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreAttendanceRequest;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceController extends Controller
{
    public function __construct(protected AttendanceService $attendanceService)
    {
        //
    }

    /**
     * Submit attendance
     * 
     * @param StoreAttendanceRequest $request
     * @return JsonResponse
     */
    public function store(StoreAttendanceRequest $request): JsonResponse
    {
        $result = $this->attendanceService->submitAttendance(
            $request->user(),
            $request->validated()
        );

        if (!$result['success']) {
            $statusCode = match ($result['code']) {
                'ALREADY_ATTENDED' => 409,
                'INVALID_CODE' => 400,
                'OUT_OF_RADIUS' => 400,
                'OUT_OF_TIME_WINDOW' => 403,
                default => 422,
            };

            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'ATTENDANCE_FAILED',
                'debug' => $result['debug'] ?? null,
            ], $statusCode);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'ATTENDANCE_SUCCESS',
            'data' => $result['data'],
            'meta' => $result['meta'] ?? null,
        ], 201);
    }

    /**
     * Get attendance history
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        $history = $this->attendanceService->getHistory(
            $request->user()->id,
            $request->only(['month', 'year', 'status', 'start_date', 'end_date'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat absensi berhasil diambil.',
            'code' => 'HISTORY_SUCCESS',
            'data' => $history,
            'meta' => [
                'current_page' => $history->currentPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
                'last_page' => $history->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get attendance statistics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->attendanceService->getStats($request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Statistik absensi berhasil diambil.',
            'code' => 'STATS_SUCCESS',
            'data' => $stats,
        ], 200);
    }

    /**
     * Get today's attendance status
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function todayStatus(Request $request): JsonResponse
    {
        $status = $this->attendanceService->getTodayStatus($request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Status absensi hari ini berhasil diambil.',
            'code' => 'TODAY_STATUS_SUCCESS',
            'data' => $status,
        ], 200);
    }
}