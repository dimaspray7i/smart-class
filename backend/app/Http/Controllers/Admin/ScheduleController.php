<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ScheduleController extends Controller
{
    public function __construct(protected ScheduleService $scheduleService)
    {
        //
    }

    /**
     * Get paginated schedules
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $schedules = $this->scheduleService->all(
            $request->only(['class_id', 'teacher_id', 'day'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal berhasil diambil.',
            'code' => 'SCHEDULES_SUCCESS',
            'data' => $schedules,
            'meta' => [
                'current_page' => $schedules->currentPage(),
                'per_page' => $schedules->perPage(),
                'total' => $schedules->total(),
                'last_page' => $schedules->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get schedule detail
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $schedule = $this->scheduleService->find($id);

        if (!$schedule) {
            return response()->json([
                'status' => 'error',
                'message' => 'Jadwal tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal berhasil diambil.',
            'code' => 'SCHEDULE_SUCCESS',
            'data' => $schedule,
        ], 200);
    }

    /**
     * Create new schedule
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $result = $this->scheduleService->create(
            $request->validate([
                'class_id' => 'required|exists:classes,id',
                'subject_id' => 'required|exists:subjects,id',
                'teacher_id' => 'required|exists:users,id',
                'day' => 'required|in:senin,selasa,rabu,kamis,jumat,sabtu',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'room' => 'nullable|string|max:50',
                'is_active' => 'boolean',
            ])
        );

        if (!$result['success']) {
            $statusCode = $result['code'] === 'SCHEDULE_CONFLICT' ? 409 : 400;
            
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CREATE_FAILED',
            ], $statusCode);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'CREATE_SUCCESS',
            'data' => $result['schedule'],
        ], 201);
    }

    /**
     * Update schedule
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $result = $this->scheduleService->update($id, $request->validate([
            'class_id' => 'sometimes|exists:classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'teacher_id' => 'sometimes|exists:users,id',
            'day' => 'sometimes|in:senin,selasa,rabu,kamis,jumat,sabtu',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ]));

        if (!$result['success']) {
            $statusCode = $result['code'] === 'SCHEDULE_CONFLICT' ? 409 : 400;
            
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'UPDATE_FAILED',
            ], $statusCode);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'UPDATE_SUCCESS',
            'data' => $result['schedule'],
        ], 200);
    }

    /**
     * Delete schedule
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $result = $this->scheduleService->delete($id);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'DELETE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'DELETE_SUCCESS',
        ], 200);
    }

    /**
     * Check schedule conflict before creating
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $hasConflict = $this->scheduleService->checkConflict(
            $request->validate([
                'class_id' => 'required|exists:classes,id',
                'teacher_id' => 'required|exists:users,id',
                'day' => 'required|in:senin,selasa,rabu,kamis,jumat,sabtu',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i',
            ])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengecekan konflik berhasil.',
            'code' => 'CONFLICT_CHECK_SUCCESS',
            'data' => [
                'has_conflict' => $hasConflict,
                'message' => $hasConflict 
                    ? 'Jadwal bentrok dengan jadwal lain.' 
                    : 'Tidak ada konflik jadwal.',
            ],
        ], 200);
    }

    /**
     * Get schedules by teacher
     * 
     * @param int $teacherId
     * @return JsonResponse
     */
    public function byTeacher(int $teacherId): JsonResponse
    {
        $schedules = $this->scheduleService->getByTeacher($teacherId);

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal guru berhasil diambil.',
            'code' => 'TEACHER_SCHEDULES_SUCCESS',
            'data' => $schedules,
        ], 200);
    }
}