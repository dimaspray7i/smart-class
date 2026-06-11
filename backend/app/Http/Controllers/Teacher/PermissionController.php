<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PermissionController extends Controller
{
    /**
     * Constructor dengan Dependency Injection
     */
    public function __construct(protected PermissionService $permissionService)
    {
        // Middleware handled at route level
    }

    /**
     * 📋 Get pending permissions with filters
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $filters = $request->only(['type', 'status', 'class_id', 'date_from', 'date_to', 'search']);
            $perPage = $request->integer('per_page', 15);

            $result = $this->permissionService->getPermissions($teacherId, $filters, $perPage);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'PERMISSIONS_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Permohonan izin berhasil diambil.',
                'code' => 'PERMISSIONS_SUCCESS',
                'data' => $result['data'],
                'meta' => [
                    'current_page' => $result['meta']['current_page'],
                    'per_page' => $result['meta']['per_page'],
                    'total' => $result['meta']['total'],
                    'last_page' => $result['meta']['last_page'],
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('PermissionController::index failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat permohonan izin.',
                'code' => 'PERMISSIONS_ERROR',
            ], 500);
        }
    }

    /**
     * ✅ Approve permission request
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'note' => 'nullable|string|max:500',
                'notify_student' => 'nullable|boolean',
                'auto_update_attendance' => 'nullable|boolean',
            ]);

            $result = $this->permissionService->approve($id, $teacherId, $validated['note'] ?? null);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'APPROVE_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'APPROVE_SUCCESS',
                'data' => $result['permission'],
                'retro' => [
                    'badge' => 'APPROVED',
                    'sparkle' => true,
                ],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('PermissionController::approve failed', [
                'teacher_id' => $request->user()?->id,
                'permission_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui izin.',
                'code' => 'APPROVE_ERROR',
            ], 500);
        }
    }

    /**
     * ❌ Reject permission request
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
                'notify_student' => 'nullable|boolean',
            ]);

            $result = $this->permissionService->reject($id, $teacherId, $validated['reason'] ?? null);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'REJECT_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'REJECT_SUCCESS',
                'data' => $result['permission'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('PermissionController::reject failed', [
                'teacher_id' => $request->user()?->id,
                'permission_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menolak izin.',
                'code' => 'REJECT_ERROR',
            ], 500);
        }
    }

    /**
     * 🔄 Bulk process permissions (approve/reject multiple)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkProcess(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            
            $validated = $request->validate([
                'permission_ids' => 'required|array|min:1',
                'permission_ids.*' => 'required|integer|exists:permissions,id',
                'action' => 'required|in:approve,reject',
                'note' => 'nullable|string|max:500',
                'reason' => 'nullable|string|max:500|required_if:action,reject',
                'notify_students' => 'nullable|boolean',
            ]);

            $result = $this->permissionService->bulkProcess($teacherId, $validated);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'BULK_PROCESS_FAILED',
                    'details' => $result['details'] ?? null,
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'BULK_PROCESS_SUCCESS',
                'data' => [
                    'processed' => $result['processed'],
                    'failed' => $result['failed'],
                    'errors' => $result['errors'] ?? [],
                ],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('PermissionController::bulkProcess failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memproses izin secara massal.',
                'code' => 'BULK_PROCESS_ERROR',
            ], 500);
        }
    }

    /**
     * 📝 Submit permission request (for students - via teacher proxy)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            $validated = $request->validate([
                'student_id'      => 'required|exists:users,id',
                'date_from'       => 'required|date|after_or_equal:today',
                'date_to'         => 'required|date|after_or_equal:date_from',
                'type'            => 'required|in:Izin,Sakit',
                'reason'          => 'required|string|max:1000',
                'attachment_url'  => 'nullable|string|max:500',
                'attachment_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
                'notify_parent'   => 'nullable|boolean',
            ]);

            // ── SECURITY: IDOR prevention ────────────────────────────────
            // Ensure the target student belongs to one of this teacher's classes.
            // Without this check, a teacher from class A can proxy-submit
            // permission requests for students of class B (Broken Access Control).
            $teacherClassIds = DB::table('class_user')
                ->where('user_id', $teacherId)
                ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
                ->where('is_active', true)
                ->pluck('class_id');

            $studentBelongsToTeacher = DB::table('class_user')
                ->where('user_id', $validated['student_id'])
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->whereIn('class_id', $teacherClassIds)
                ->exists();

            if (!$studentBelongsToTeacher) {
                Log::warning('PermissionController::store IDOR attempt blocked', [
                    'teacher_id' => $teacherId,
                    'student_id' => $validated['student_id'],
                ]);
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Anda tidak memiliki akses untuk mengajukan izin bagi siswa ini.',
                    'code'    => 'FORBIDDEN_STUDENT',
                ], 403);
            }
            // ────────────────────────────────────────────────────────────

            // Handle file upload if present
            if ($request->hasFile('attachment_file')) {
                $validated['attachment_file'] = $request->file('attachment_file');
            }

            $result = $this->permissionService->submit($validated['student_id'], $validated);

            if (!$result['success']) {
                return response()->json([
                    'status'  => 'error',
                    'message' => $result['message'],
                    'code'    => $result['code'] ?? 'SUBMIT_FAILED',
                ], 400);
            }

            return response()->json([
                'status'  => 'success',
                'message' => $result['message'],
                'code'    => 'SUBMIT_SUCCESS',
                'data'    => $result['permission'],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Validasi gagal.',
                'code'    => 'VALIDATION_ERROR',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('PermissionController::store failed', [
                'teacher_id' => $request->user()?->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengajukan permohonan izin.',
                'code'    => 'SUBMIT_ERROR',
            ], 500);
        }
    }

    /**
     * 📚 Get permission history for teacher's students
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $filters = $request->only(['student_id', 'status', 'type', 'date_from', 'date_to']);
            $perPage = $request->integer('per_page', 20);

            $result = $this->permissionService->getHistory($teacherId, $filters, $perPage);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'HISTORY_FAILED',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Riwayat izin berhasil diambil.',
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
            Log::error('PermissionController::history failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat riwayat izin.',
                'code' => 'HISTORY_ERROR',
            ], 500);
        }
    }

    /**
     * 📊 Get permission statistics/analytics
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;
            $period = $request->query('period', 'monthly');

            $result = $this->permissionService->getAnalytics($teacherId, $period);

            return response()->json([
                'status' => 'success',
                'message' => 'Statistik izin berhasil diambil.',
                'code' => 'ANALYTICS_SUCCESS',
                'data' => $result,
            ], 200);

        } catch (\Exception $e) {
            Log::error('PermissionController::analytics failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat statistik izin.',
                'code' => 'ANALYTICS_ERROR',
            ], 500);
        }
    }

    /**
     * 📤 Export permissions data
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
                'status' => 'nullable|in:pending,approved,rejected,all',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'class_id' => 'nullable|exists:classes,id',
            ]);

            $result = $this->permissionService->exportData($teacherId, $validated);

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
            Log::error('PermissionController::export failed', [
                'teacher_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export data izin.',
                'code' => 'EXPORT_ERROR',
            ], 500);
        }
    }
}