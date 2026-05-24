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
                'ALREADY_ATTENDED' => 409, // Conflict
                'INVALID_CODE' => 400,     // Bad Request
                'OUT_OF_RADIUS' => 400,    // Bad Request
                'OUT_OF_TIME_WINDOW' => 403, // Forbidden
                default => 422,            // Unprocessable Entity
            };

            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'ATTENDANCE_FAILED',
                'debug' => config('app.debug') ? ($result['debug'] ?? null) : null,
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
        $history = $this->attendanceService->getStudentHistory(
            $request->user()->id,
            $request->only(['month', 'year', 'status', 'start_date', 'end_date', 'pkl_only', 'per_page'])
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
                'from' => $history->firstItem(),
                'to' => $history->lastItem(),
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

    /**
     * Get approved PKL locations for class 12 student
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getPklLocations(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Check if user is eligible for PKL attendance
        if (!$user->isPklEligible()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Fitur absensi PKL hanya tersedia untuk siswa kelas 12.',
                'code' => 'NOT_ELIGIBLE',
                'data' => [],
            ], 403);
        }

        $locations = $this->attendanceService->getPklLocationsForStudent($user);

        return response()->json([
            'status' => 'success',
            'message' => 'Lokasi PKL yang disetujui berhasil diambil.',
            'code' => 'PKL_LOCATIONS_SUCCESS',
            'data' => $locations,
            'meta' => [
                'total' => count($locations),
                'user_class_level' => $user->getClassLevelAttribute(),
            ],
        ], 200);
    }

    /**
     * Validate attendance location (for pre-check before submit)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function validateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $result = $this->attendanceService->validateAttendanceLocation(
            $request->user(),
            $validated['lat'],
            $validated['lng']
        );

        $statusCode = $result['can_attend'] ? 200 : 400;

        return response()->json([
            'status' => $result['can_attend'] ? 'success' : 'error',
            'message' => $result['message'],
            'code' => $result['can_attend'] ? 'LOCATION_VALID' : 'LOCATION_INVALID',
            'data' => [
                'can_attend' => $result['can_attend'],
                'location_type' => $result['location_type'],
                'location_name' => $result['location_name'],
                'distance' => $result['distance'],
                'max_radius' => $result['max_radius'],
            ],
        ], $statusCode);
    }
}