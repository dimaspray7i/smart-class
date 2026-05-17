<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    /**
     * Constructor dengan Dependency Injection
     */
    public function __construct(protected AttendanceService $attendanceService)
    {
        // Middleware handled at route level
    }

    /**
     * 📋 Get attendance sessions with filters & pagination
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function sessions(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $filters = $request->only([
                'date', 'date_from', 'date_to', 'status', 'class_id', 'subject_id', 'search'
            ]);
            $perPage = $request->integer('per_page', 15);

            $result = $this->attendanceService->getSessions($teacherId, $filters, $perPage);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'SESSIONS_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Sesi absensi berhasil diambil.',
                'code' => 'SESSIONS_SUCCESS',
                'data' => $result['data'],
                'meta' => [
                    'current_page' => $result['meta']['current_page'],
                    'per_page' => $result['meta']['per_page'],
                    'total' => $result['meta']['total'],
                    'last_page' => $result['meta']['last_page'],
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::sessions failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat sesi absensi.',
                'code' => 'SESSIONS_ERROR',
            ], 500);
        }
    }

    /**
     * ✨ Create new attendance session with QR & geofence support
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function createSession(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'class_id' => 'required|exists:classes,id',
                'subject_id' => 'required|exists:subjects,id',
                'date' => 'required|date|after_or_equal:today',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'duration_minutes' => 'sometimes|integer|min:1|max:240',
                'location' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
                // Geofence settings
                'enable_geofence' => 'nullable|boolean',
                'radius_meters' => 'nullable|integer|min:10|max:1000',
                'center_lat' => 'nullable|numeric|between:-90,90',
                'center_lng' => 'nullable|numeric|between:-180,180',
                // QR settings
                'enable_qr' => 'nullable|boolean',
                'qr_expiry_minutes' => 'nullable|integer|min:5|max:120',
                'max_uses' => 'nullable|integer|min:1',
            ]);

            $result = $this->attendanceService->createSession($teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'CREATE_SESSION_FAILED',
                    'errors' => $result['errors'] ?? null,
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'SESSION_CREATED',
                'data' => $result['data'],
                'retro' => [
                    'badge' => 'SESSION_ACTIVE',
                    'sparkle' => true,
                ],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('AttendanceController::createSession failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat sesi absensi.',
                'code' => 'CREATE_SESSION_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * ✨ Generate attendance session automatically from schedule ID
     * 
     * @param Request $request
     * @param int $scheduleId
     * @return JsonResponse
     */
    public function generateFromSchedule(Request $request, int $scheduleId): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            $result = $this->attendanceService->generateFromSchedule($scheduleId, $teacherId);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'GENERATE_SESSION_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'SESSION_CREATED',
                'data' => $result['data'],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::generateFromSchedule failed', [
                'teacher_id' => $request->user()?->id,
                'schedule_id' => $scheduleId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat sesi absensi dari jadwal.',
                'code' => 'GENERATE_SESSION_ERROR',
            ], 500);
        }
    }

    /**
     * 🔄 Generate/refresh QR code for existing session
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function generateCode(Request $request, int $id): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'expiry_minutes' => 'nullable|integer|min:5|max:120',
                'max_uses' => 'nullable|integer|min:1',
                'regenerate' => 'nullable|boolean',
            ]);

            $result = $this->attendanceService->generateCode($id, $teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'GENERATE_CODE_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'CODE_GENERATED',
                'data' => $result['data'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('AttendanceController::generateCode failed', [
                'teacher_id' => $request->user()?->id,
                'session_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal generate QR code.',
                'code' => 'GENERATE_CODE_ERROR',
            ], 500);
        }
    }

    /**
     * 🚪 Close attendance session
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function closeSession(Request $request, int $id): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'reason' => 'nullable|string|max:500',
                'auto_mark_absent' => 'nullable|boolean',
            ]);

            $result = $this->attendanceService->closeSession($id, $teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'CLOSE_SESSION_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'SESSION_CLOSED',
                'data' => $result['data'] ?? null,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('AttendanceController::closeSession failed', [
                'teacher_id' => $request->user()?->id,
                'session_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menutup sesi absensi.',
                'code' => 'CLOSE_SESSION_ERROR',
            ], 500);
        }
    }

    /**
     * 👁️ Monitor attendance session (real-time stats)
     * 
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function monitor(int $id, Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $includeStudents = $request->boolean('include_students', false);
            $limit = $request->integer('student_limit', 50);

            $result = $this->attendanceService->monitorSession($id, $teacherId, [
                'include_students' => $includeStudents,
                'student_limit' => $limit,
            ]);

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
                'meta' => [
                    'last_updated' => now()->toDateTimeString(),
                    'refresh_interval' => 30, // seconds
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::monitor failed', [
                'teacher_id' => $request->user()?->id,
                'session_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memonitor sesi.',
                'code' => 'MONITOR_ERROR',
            ], 500);
        }
    }

    /**
     * 📚 Get attendance history with filters
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $filters = $request->only([
                'class_id', 'subject_id', 'student_id', 
                'start_date', 'end_date', 'status', 'search'
            ]);
            $perPage = $request->integer('per_page', 20);

            $result = $this->attendanceService->getHistory($teacherId, $filters, $perPage);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'HISTORY_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Riwayat absensi berhasil diambil.',
                'code' => 'HISTORY_SUCCESS',
                'data' => $result['data'],
                'meta' => [
                    'current_page' => $result['meta']['current_page'],
                    'per_page' => $result['meta']['per_page'],
                    'total' => $result['meta']['total'],
                    'last_page' => $result['meta']['last_page'],
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::history failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat riwayat absensi.',
                'code' => 'HISTORY_ERROR',
            ], 500);
        }
    }

    /**
     * ✏️ Manual verify/update attendance record
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function manualVerify(Request $request, int $id): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'status' => 'required|in:Hadir,Terlambat,Izin,Sakit,Alpha',
                'check_in_time' => 'nullable|date_format:H:i',
                'check_out_time' => 'nullable|date_format:H:i|after:check_in_time',
                'location_lat' => 'nullable|numeric|between:-90,90',
                'location_lng' => 'nullable|numeric|between:-180,180',
                'notes' => 'nullable|string|max:500',
                'notify_student' => 'nullable|boolean',
            ]);

            $result = $this->attendanceService->manualVerify($teacherId, $id, $validated['status']);

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

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('AttendanceController::manualVerify failed', [
                'teacher_id' => $request->user()?->id,
                'attendance_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memverifikasi absensi.',
                'code' => 'VERIFY_ERROR',
            ], 500);
        }
    }

    /**
     * 👥 Get all students taught by teacher
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function students(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $classId = $request->query('class_id');
            $search = $request->query('search');
            $perPage = $request->integer('per_page', 50);

            $result = $this->attendanceService->getStudents($teacherId, $classId, $search, $perPage);

            return response()->json([
                'status' => 'success',
                'message' => 'Daftar siswa berhasil diambil.',
                'code' => 'STUDENTS_SUCCESS',
                'data' => $result['data'],
                'meta' => $result['meta'] ?? null,
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::students failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat daftar siswa.',
                'code' => 'STUDENTS_ERROR',
            ], 500);
        }
    }

    /**
     * 📊 Get detailed attendance for specific student
     * 
     * @param int $id (student_id)
     * @param Request $request
     * @return JsonResponse
     */
    public function studentAttendance(int $id, Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
            $endDate = $request->query('end_date', now()->toDateString());
            $includeStats = $request->boolean('include_stats', true);

            $result = $this->attendanceService->getStudentAttendance(
                $teacherId, $id, $startDate, $endDate, $includeStats
            );

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'STUDENT_ATTENDANCE_FAILED',
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Riwayat absensi siswa berhasil diambil.',
                'code' => 'STUDENT_ATTENDANCE_SUCCESS',
                'data' => $result['data'],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::studentAttendance failed', [
                'teacher_id' => $request->user()?->id,
                'student_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat riwayat absensi siswa.',
                'code' => 'STUDENT_ATTENDANCE_ERROR',
            ], 500);
        }
    }

    /**
     * 📤 Export attendance data
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response|JsonResponse
     */
    public function export(Request $request)
    {
        try {
            $teacherId = $request->user()->id;
            $validated = $request->validate([
                'format' => 'required|in:csv,json,xlsx',
                'data_type' => 'required|in:sessions,records,summary',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'class_id' => 'nullable|exists:classes,id',
                'include_details' => 'nullable|boolean',
            ]);

            $result = $this->attendanceService->exportData($teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'EXPORT_FAILED',
                ], 400);
            }

            if ($validated['format'] === 'json') {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Data berhasil diexport.',
                    'code' => 'EXPORT_SUCCESS',
                    'data' => $result['data'],
                ], 200);
            }

            return response()->streamDownload(function () use ($result) {
                echo $result['file_content'];
            }, $result['filename'], [
                'Content-Type' => $result['content_type'],
                'Content-Disposition' => "attachment; filename=\"{$result['filename']}\"",
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi parameter export gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('AttendanceController::export failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export data absensi.',
                'code' => 'EXPORT_ERROR',
            ], 500);
        }
    }
}