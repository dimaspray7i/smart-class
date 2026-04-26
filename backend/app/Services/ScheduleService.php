<?php

namespace App\Services\Admin;

use App\Models\Schedule;
use Illuminate\Support\Facades\Log;
use Exception;

class ScheduleService
{
    public function all(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
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

        return $query->with(['class', 'subject', 'teacher'])->orderBy('day')->orderBy('start_time')->paginate(15);
    }

    public function find(int $id): ?Schedule
    {
        return Schedule::with(['class', 'subject', 'teacher'])->find($id);
    }

    public function create(array $data): array
    {
        try {
            // Check for conflicts
            if ($this->hasConflict($data)) {
                return [
                    'success' => false,
                    'message' => 'Jadwal bentrok dengan jadwal lain.',
                    'code' => 'SCHEDULE_CONFLICT',
                ];
            }

            $schedule = Schedule::create($data);

            return [
                'success' => true,
                'message' => 'Jadwal berhasil dibuat.',
                'schedule' => $schedule,
            ];

        } catch (Exception $e) {
            Log::error('ScheduleService::create failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal membuat jadwal.', 'code' => 'SERVER_ERROR'];
        }
    }

    public function update(int $id, array $data): array
    {
        try {
            $schedule = Schedule::find($id);
            if (!$schedule) {
                return ['success' => false, 'message' => 'Jadwal tidak ditemukan.', 'code' => 'NOT_FOUND'];
            }

            // Check for conflicts (excluding current schedule)
            $tempSchedule = new Schedule($data);
            $tempSchedule->id = $id;

            if ($this->hasConflict($data, $id)) {
                return [
                    'success' => false,
                    'message' => 'Jadwal bentrok dengan jadwal lain.',
                    'code' => 'SCHEDULE_CONFLICT',
                ];
            }

            $schedule->update($data);
            return ['success' => true, 'message' => 'Jadwal berhasil diupdate.', 'schedule' => $schedule->fresh()];

        } catch (Exception $e) {
            Log::error('ScheduleService::update failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal update jadwal.', 'code' => 'SERVER_ERROR'];
        }
    }

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
            Log::error('ScheduleService::delete failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal menghapus jadwal.', 'code' => 'SERVER_ERROR'];
        }
    }

    public function checkConflict(array $data): bool
    {
        return $this->hasConflict($data);
    }

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

    private function hasConflict(array $data, ?int $excludeId = null): bool
    {
        $query = Schedule::where('class_id', $data['class_id'])
            ->where('teacher_id', $data['teacher_id'])
            ->where('day', $data['day'])
            ->where('is_active', true);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $schedules = $query->get();

        foreach ($schedules as $schedule) {
            if ($this->timeOverlaps($data['start_time'], $data['end_time'], $schedule->start_time, $schedule->end_time)) {
                return true;
            }
        }

        return false;
    }

    private function timeOverlaps($start1, $end1, $start2, $end2): bool
    {
        $s1 = \Carbon\Carbon::parse($start1);
        $e1 = \Carbon\Carbon::parse($end1);
        $s2 = \Carbon\Carbon::parse($start2);
        $e2 = \Carbon\Carbon::parse($end2);

        return $s1->lt($e2) && $e1->gt($s2);
    }
}