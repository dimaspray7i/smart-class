<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ScheduleController extends Controller
{
    public function __construct(protected ScheduleService $scheduleService)
    {
        // Middleware handles auth & role checks
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
            $request->only(['class_id', 'teacher_id', 'day', 'search', 'is_active'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal berhasil diambil.',
            'code' => 'SCHEDULES_SUCCESS',
            'data' => $schedules->items(),
            'meta' => [
                'current_page' => $schedules->currentPage(),
                'per_page' => $schedules->perPage(),
                'total' => $schedules->total(),
                'last_page' => $schedules->lastPage(),
                'from' => $schedules->firstItem(),
                'to' => $schedules->lastItem(),
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
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:users,id',
            'day' => 'required|in:senin,selasa,rabu,kamis,jumat,sabtu',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $result = $this->scheduleService->create($validated);

        if (!$result['success']) {
            $statusCode = $result['code'] === 'SCHEDULE_CONFLICT' ? 409 : 400;
            
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CREATE_FAILED',
                'errors' => $result['errors'] ?? null,
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
        $validated = $request->validate([
            'class_id' => 'sometimes|exists:classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'teacher_id' => 'sometimes|exists:users,id',
            'day' => 'sometimes|in:senin,selasa,rabu,kamis,jumat,sabtu',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
        ]);

        $result = $this->scheduleService->update($id, $validated);

        if (!$result['success']) {
            $statusCode = $result['code'] === 'SCHEDULE_CONFLICT' ? 409 : 400;
            
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'UPDATE_FAILED',
                'errors' => $result['errors'] ?? null,
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
     * Bulk delete schedules
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function destroyBulk(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada jadwal yang dipilih.',
                'code' => 'NO_IDS_PROVIDED',
            ], 400);
        }

        try {
            DB::beginTransaction();
            
            $results = [];
            $successCount = 0;
            
            foreach ($ids as $id) {
                $result = $this->scheduleService->delete($id);
                $results[] = ['id' => $id, 'success' => $result['success'], 'message' => $result['message'] ?? ''];
                if ($result['success']) $successCount++;
            }
            
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => "{$successCount} dari " . count($ids) . " jadwal berhasil dihapus.",
                'code' => 'BULK_DELETE_SUCCESS',
                'data' => $results,
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('ScheduleController::destroyBulk failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus jadwal secara massal.',
                'code' => 'BULK_DELETE_FAILED',
            ], 500);
        }
    }

    /**
     * Export schedules to CSV
     * 
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function export(Request $request)
    {
        $filters = $request->only(['class_id', 'teacher_id', 'day', 'search', 'is_active']);
        
        $schedules = DB::table('schedules')
            ->join('classes', 'schedules.class_id', '=', 'classes.id')
            ->join('subjects', 'schedules.subject_id', '=', 'subjects.id')
            ->join('users as teachers', 'schedules.teacher_id', '=', 'teachers.id')
            ->select(
                'schedules.id',
                'classes.name as class_name',
                'subjects.code as subject_code',
                'subjects.name as subject_name',
                'teachers.name as teacher_name',
                'schedules.day',
                'schedules.start_time',
                'schedules.end_time',
                'schedules.room',
                'schedules.is_active',
                'schedules.created_at'
            )
            ->when(!empty($filters['class_id']), fn($q) => $q->where('schedules.class_id', $filters['class_id']))
            ->when(!empty($filters['teacher_id']), fn($q) => $q->where('schedules.teacher_id', $filters['teacher_id']))
            ->when(!empty($filters['day']), fn($q) => $q->where('schedules.day', $filters['day']))
            ->when(!empty($filters['is_active']), fn($q) => $q->where('schedules.is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN)))
            ->when(!empty($filters['search']), function($q) use ($filters) {
                $q->where(function($sub) use ($filters) {
                    $sub->where('classes.name', 'like', "%{$filters['search']}%")
                        ->orWhere('subjects.name', 'like', "%{$filters['search']}%")
                        ->orWhere('teachers.name', 'like', "%{$filters['search']}%");
                });
            })
            ->orderBy('schedules.day')
            ->orderBy('schedules.start_time')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="schedules-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function() use ($schedules) {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 Excel compatibility
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // CSV Header
            fputcsv($file, [
                'ID', 'Kelas', 'Kode Mapel', 'Nama Mapel', 'Guru', 
                'Hari', 'Waktu Mulai', 'Waktu Selesai', 'Durasi (menit)', 
                'Ruang', 'Status', 'Dibuat Pada'
            ], ';');
            
            // CSV Data
            foreach ($schedules as $schedule) {
                $duration = strtotime($schedule->end_time) - strtotime($schedule->start_time);
                $durationMinutes = round($duration / 60);
                
                fputcsv($file, [
                    $schedule->id,
                    $schedule->class_name,
                    $schedule->subject_code,
                    $schedule->subject_name,
                    $schedule->teacher_name,
                    ucfirst($schedule->day),
                    $schedule->start_time,
                    $schedule->end_time,
                    $durationMinutes,
                    $schedule->room ?? '-',
                    $schedule->is_active ? 'Aktif' : 'Non-Aktif',
                    date('d/m/Y H:i', strtotime($schedule->created_at)),
                ], ';');
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Check schedule conflict before creating
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function checkConflict(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'required|exists:users,id',
            'day' => 'required|in:senin,selasa,rabu,kamis,jumat,sabtu',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
        ]);

        $conflictResult = $this->scheduleService->checkConflict($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengecekan konflik berhasil.',
            'code' => 'CONFLICT_CHECK_SUCCESS',
            'data' => [
                'has_conflict' => is_string($conflictResult),
                'message' => is_string($conflictResult) ? $conflictResult : 'Tidak ada konflik jadwal.',
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