<?php

namespace App\Services;

use App\Models\Schedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class ScheduleService
{
    /**
     * Get paginated schedules with filters
     */
    public function all(array $filters = []): \Illuminate\Support\Collection|\Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Schedule::query();

        if (!empty($filters['class_id'])) {
            $query->where('class_id', $filters['class_id']);
        }

        if (!empty($filters['teacher_id'])) {
            $query->where('teacher_id', $filters['teacher_id']);
        }

        if (!empty($filters['day'])) {
            $query->where('day', $filters['day']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        $query->with(['class', 'subject', 'teacher'])
            ->orderBy('day')
            ->orderBy('start_time');

        return !empty($filters['all']) ? $query->get() : $query->paginate(15);
    }

    /**
     * Find schedule by ID with relationships
     */
    public function find(int $id): ?Schedule
    {
        return Schedule::with(['class', 'subject', 'teacher'])->find($id);
    }

    /**
     * Create new schedule with conflict check & transaction
     */
    public function create(array $data): array
    {
        try {
            DB::beginTransaction();

            // Check for conflicts (returns false or conflict message string)
            $conflict = $this->hasConflict($data);
            if ($conflict !== false) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Jadwal bentrok dengan jadwal lain.',
                    'code' => 'SCHEDULE_CONFLICT',
                    'errors' => ['non_field_errors' => [$conflict]],
                ];
            }

            $schedule = Schedule::create($data);
            
            DB::commit();

            return [
                'success' => true,
                'message' => 'Jadwal berhasil dibuat.',
                'schedule' => $schedule->load(['class', 'subject', 'teacher']),
            ];

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('ScheduleService::create failed', ['error' => $e->getMessage(), 'data' => $data]);
            return ['success' => false, 'message' => 'Gagal membuat jadwal: ' . $e->getMessage(), 'code' => 'SERVER_ERROR'];
        }
    }

    /**
     * Update schedule with conflict check & transaction
     */
    public function update(int $id, array $data): array
    {
        try {
            $schedule = Schedule::find($id);
            if (!$schedule) {
                return ['success' => false, 'message' => 'Jadwal tidak ditemukan.', 'code' => 'NOT_FOUND'];
            }

            DB::beginTransaction();

            // Check for conflicts (excluding current schedule)
            $conflict = $this->hasConflict($data, $id);
            if ($conflict !== false) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Jadwal bentrok dengan jadwal lain.',
                    'code' => 'SCHEDULE_CONFLICT',
                    'errors' => ['non_field_errors' => [$conflict]],
                ];
            }

            $schedule->update($data);
            
            DB::commit();
            
            return ['success' => true, 'message' => 'Jadwal berhasil diupdate.', 'schedule' => $schedule->fresh()->load(['class', 'subject', 'teacher'])];

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('ScheduleService::update failed', ['error' => $e->getMessage(), 'id' => $id, 'data' => $data]);
            return ['success' => false, 'message' => 'Gagal update jadwal: ' . $e->getMessage(), 'code' => 'SERVER_ERROR'];
        }
    }

    /**
     * Delete schedule
     */
    public function delete(int $id): array
    {
        try {
            $schedule = Schedule::find($id);
            if (!$schedule) {
                return ['success' => false, 'message' => 'Jadwal tidak ditemukan.', 'code' => 'NOT_FOUND'];
            }

            $schedule->delete();
            return ['success' => true, 'message' => 'Jadwal berhasil dihapus.'];

        } catch (Exception $e) {
            Log::error('ScheduleService::delete failed', ['error' => $e->getMessage(), 'id' => $id]);
            return ['success' => false, 'message' => 'Gagal menghapus jadwal: ' . $e->getMessage(), 'code' => 'SERVER_ERROR'];
        }
    }

    /**
     * Check schedule conflict (returns false or conflict message string)
     */
    public function checkConflict(array $data): bool|string
    {
        return $this->hasConflict($data);
    }

    /**
     * Get schedules by teacher
     */
    public function getByTeacher(int $teacherId): array
    {
        return Schedule::where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->with(['class', 'subject'])
            ->orderBy('day')
            ->orderBy('start_time')
            ->get()
            ->toArray();
    }

    /**
     * Check for time conflicts (Class & Teacher separately)
     * Returns false if no conflict, or string message if conflict exists
     */
    private function hasConflict(array $data, ?int $excludeId = null): bool|string
    {
        // 1. Check Class Conflict
        $classSchedules = Schedule::where('class_id', $data['class_id'])
            ->where('day', $data['day'])
            ->where('is_active', true)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->with(['subject'])
            ->get();

        foreach ($classSchedules as $schedule) {
            if ($this->timeOverlaps($data['start_time'], $data['end_time'], $schedule->start_time, $schedule->end_time)) {
                return "Bentrok dengan jadwal kelas: {$schedule->subject->name} ({$schedule->start_time} - {$schedule->end_time})";
            }
        }

        // 2. Check Teacher Conflict
        $teacherSchedules = Schedule::where('teacher_id', $data['teacher_id'])
            ->where('day', $data['day'])
            ->where('is_active', true)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->with(['class', 'teacher'])
            ->get();

        foreach ($teacherSchedules as $schedule) {
            if ($this->timeOverlaps($data['start_time'], $data['end_time'], $schedule->start_time, $schedule->end_time)) {
                return "Guru {$schedule->teacher->name} sudah mengajar di kelas {$schedule->class->name} pada jam tersebut.";
            }
        }

        return false;
    }

    /**
     * Check if two time ranges overlap
     */
    private function timeOverlaps($start1, $end1, $start2, $end2): bool
    {
        $s1 = \Carbon\Carbon::parse($start1);
        $e1 = \Carbon\Carbon::parse($end1);
        $s2 = \Carbon\Carbon::parse($start2);
        $e2 = \Carbon\Carbon::parse($end2);

        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return $s1->lt($e2) && $e1->gt($s2);
    }
}