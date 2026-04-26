<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
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
     * Create new attendance session
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function createSession(Request $request): JsonResponse
    {
        $result = $this->attendanceService->createSession(
            $request->user()->id,
            $request->validate([
                'class_id' => 'required|exists:classes,id',
                'duration_minutes' => 'sometimes|integer|min:1|max:120',
                'max_uses' => 'nullable|integer|min:1',
                'radius_meters' => 'sometimes|integer|min:10|max:500',
                'center_lat' => 'sometimes|numeric|between:-90,90',
                'center_lng' => 'sometimes|numeric|between:-180,180',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'SESSION_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'SESSION_CREATED',
            'data' => $result['data'],
        ], 201);
    }

    /**
     * Generate new code for existing session
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function generateCode(Request $request, int $id): JsonResponse
    {
        $result = $this->attendanceService->generateCode($id, $request->user()->id);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CODE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'CODE_GENERATED',
            'data' => $result['data'],
        ], 200);
    }

    /**
     * Close attendance session
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function closeSession(Request $request, int $id): JsonResponse
    {
        $result = $this->attendanceService->closeSession($id, $request->user()->id);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CLOSE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'SESSION_CLOSED',
        ], 200);
    }

    /**
     * Monitor attendance session (real-time)
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function monitor(int $id): JsonResponse
    {
        $result = $this->attendanceService->monitorSession($id);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'MONITOR_FAILED',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Monitoring sesi berhasil.',
            'code' => 'MONITOR_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }

    /**
     * Get attendance history for teacher's students
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        $history = $this->attendanceService->getTeacherHistory(
            $request->user()->id,
            $request->only(['class_id', 'start_date', 'end_date', 'status'])
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
     * Manual verify attendance
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function manualVerify(Request $request, int $id): JsonResponse
    {
        $result = $this->attendanceService->manualVerify(
            $request->user()->id,
            $id,
            $request->validate([
                'status' => 'required|in:Hadir,Terlambat,Izin,Sakit,Alpha',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'VERIFY_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'VERIFY_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }

    /**
     * Get all students taught by teacher
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function students(Request $request): JsonResponse
    {
        $students = $this->attendanceService->getStudents(
            $request->user()->id,
            $request->query('class_id')
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Daftar siswa berhasil diambil.',
            'code' => 'STUDENTS_SUCCESS',
            'data' => $students,
        ], 200);
    }

    /**
     * Get student attendance detail
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function studentAttendance(int $id, Request $request): JsonResponse
    {
        $attendance = $this->attendanceService->getStudentAttendance(
            $id,
            $request->query('start_date', now()->subDays(30)->toDateString()),
            $request->query('end_date', now()->toDateString())
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat absensi siswa berhasil diambil.',
            'code' => 'STUDENT_ATTENDANCE_SUCCESS',
            'data' => $attendance,
        ], 200);
    }
}