<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\TeacherService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\ClassModel;
use App\Models\Subject;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Constructor dengan Dependency Injection
     */
    public function __construct(protected TeacherService $teacherService)
    {
        // Middleware handled at route level
    }

    /**
     * 📊 Get teacher dashboard overview with comprehensive stats
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $filters = $request->only(['date', 'class_id', 'subject_id']);

            $result = $this->teacherService->getDashboardData($teacherId, $filters);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'DASHBOARD_FAILED',
                    'debug' => config('app.debug') ? $result['debug'] ?? null : null,
                ], 500);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Dashboard guru berhasil diambil.',
                'code' => 'DASHBOARD_SUCCESS',
                'data' => $result['data'],
                'meta' => [
                    'timestamp' => now()->toDateTimeString(),
                    'timezone' => config('app.timezone'),
                    'retro_version' => '2.0.0',
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('DashboardController::index failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memuat dashboard.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * 📈 Get analytics data for charts & reports
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $validated = $request->validate([
                'period' => 'nullable|in:daily,weekly,monthly,yearly',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'class_id' => 'nullable|exists:classes,id',
                'metric' => 'nullable|in:attendance,permissions,performance,all',
            ]);

            $result = $this->teacherService->getAnalytics($teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'ANALYTICS_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Analytics berhasil diambil.',
                'code' => 'ANALYTICS_SUCCESS',
                'data' => $result['data'],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi parameter gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('DashboardController::analytics failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat analytics.',
                'code' => 'ANALYTICS_ERROR',
            ], 500);
        }
    }

    /**
     * 📤 Export dashboard data to CSV/JSON
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response|JsonResponse
     */
    public function export(Request $request)
    {
        try {
            $teacherId = $request->user()->id;
            $validated = $request->validate([
                'format' => 'required|in:csv,json,pdf',
                'data_type' => 'required|in:attendance,permissions,students,all',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $result = $this->teacherService->exportData($teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'EXPORT_FAILED',
                ], 400);
            }

            // Return file download for CSV/PDF, JSON for API
            if ($validated['format'] === 'json') {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Data berhasil diexport.',
                    'code' => 'EXPORT_SUCCESS',
                    'data' => $result['data'],
                ], 200);
            }

            // Return file download
            return response()->streamDownload(function () use ($result) {
                echo $result['file_content'];
            }, $result['filename'], [
                'Content-Type' => $result['content_type'],
                'Content-Disposition' => "attachment; filename=\"{$result['filename']}\"",
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi parameter export gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('DashboardController::export failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export data.',
                'code' => 'EXPORT_ERROR',
            ], 500);
        }
    }

    /**
     * 🔔 Get notifications for teacher
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function notifications(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $limit = $request->integer('limit', 10);
            $unreadOnly = $request->boolean('unread_only', false);

            $result = $this->teacherService->getNotifications($teacherId, $limit, $unreadOnly);

            return response()->json([
                'status' => 'success',
                'message' => 'Notifikasi berhasil diambil.',
                'code' => 'NOTIFICATIONS_SUCCESS',
                'data' => $result,
            ], 200);

        } catch (\Exception $e) {
            Log::error('DashboardController::notifications failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat notifikasi.',
                'code' => 'NOTIFICATIONS_ERROR',
            ], 500);
        }
    }

    /**
     * ✅ Mark notification as read
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function markNotificationRead(Request $request, $id): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            $result = $this->teacherService->markNotificationRead($teacherId, $id);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'MARK_READ_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Notifikasi telah ditandai sebagai dibaca.',
                'code' => 'MARK_READ_SUCCESS',
            ], 200);

        } catch (\Exception $e) {
            Log::error('DashboardController::markNotificationRead failed', [
                'teacher_id' => $request->user()?->id,
                'notification_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menandai notifikasi.',
                'code' => 'MARK_READ_ERROR',
            ], 500);
        }
    }

    /**
     * 🏫 Get classes taught by teacher
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function myClasses(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            // Get class IDs from schedules
            $scheduleClassIds = DB::table('schedules')
                ->where('teacher_id', $teacherId)
                ->where('is_active', true)
                ->pluck('class_id')
                ->toArray();

            // Get class IDs from class_user assignments (wali_kelas or guru_pengampu)
            $classUserIds = DB::table('class_user')
                ->where('user_id', $teacherId)
                ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
                ->where('is_active', true)
                ->pluck('class_id')
                ->toArray();
                
            $classIds = array_unique(array_merge($scheduleClassIds, $classUserIds));
                
            $classes = ClassModel::whereIn('id', $classIds)->get()
                ->makeHidden(['wali_kelas', 'student_count', 'subject_count', 'available_capacity', 'is_full', 'teacher_count']);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Kelas pengampu berhasil diambil.',
                'code' => 'CLASSES_SUCCESS',
                'data' => $classes,
            ], 200);
        } catch (\Exception $e) {
            Log::error('DashboardController::myClasses failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat daftar kelas.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * 📚 Get subjects taught by teacher
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function mySubjects(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            // Get subject IDs
            $subjectIds = DB::table('profile_subject')
                ->join('profiles', 'profile_subject.profile_id', '=', 'profiles.id')
                ->where('profiles.user_id', $teacherId)
                ->pluck('profile_subject.subject_id')
                ->toArray();
                
            $subjects = Subject::whereIn('id', $subjectIds)->get();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Mata pelajaran berhasil diambil.',
                'code' => 'SUBJECTS_SUCCESS',
                'data' => $subjects,
            ], 200);
        } catch (\Exception $e) {
            Log::error('DashboardController::mySubjects failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat daftar mata pelajaran.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * 📅 Get today's or specific day's schedule for teacher
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function todaySchedule(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $day = $request->query('day');
            $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;
            $subjectId = $request->query('subject_id') ? (int) $request->query('subject_id') : null;
            
            $schedule = $this->teacherService->getTodaySchedule($teacherId, $day, $classId, $subjectId);

            return response()->json([
                'status' => 'success',
                'message' => 'Jadwal berhasil diambil.',
                'code' => 'SCHEDULE_SUCCESS',
                'data' => $schedule,
            ], 200);
        } catch (\Exception $e) {
            Log::error('DashboardController::todaySchedule failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat jadwal hari ini.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }
}