<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Schedule;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get student's active class
        $studentClass = $user->classes()
            ->wherePivot('is_active', true)
            ->wherePivot('role_in_class', 'siswa')
            ->first();

        if (!$studentClass) {
            return response()->json([
                'status'  => 'success',
                'message' => 'Jadwal berhasil diambil.',
                'data'    => [
                    'schedules'  => [],
                    'today'      => [],
                    'class'      => null,
                    'today_name' => null,
                ],
            ], 200);
        }

        $query = Schedule::with(['subject', 'teacher', 'teacher.profile'])
            ->where('class_id', $studentClass->id)
            ->where('is_active', true);

        if ($request->filled('day')) {
            $query->where('day', strtolower($request->day));
        }

        $schedules = $query->orderBy('day')->orderBy('start_time')->get();

        $dayMap = [
            'senin'  => 'Monday',
            'selasa' => 'Tuesday',
            'rabu'   => 'Wednesday',
            'kamis'  => 'Thursday',
            'jumat'  => 'Friday',
            'sabtu'  => 'Saturday',
        ];

        $todayEn  = now()->format('l');
        $todayId  = array_search($todayEn, $dayMap) ?: strtolower($todayEn);
        $nowTime  = now()->format('H:i');

        $grouped = $schedules->groupBy('day')->map(function ($items) use ($dayMap, $todayId, $nowTime) {
            return $items->map(function ($s) use ($dayMap, $todayId, $nowTime) {
                $isToday = $s->day === $todayId;
                $isNow   = $isToday && $nowTime >= substr($s->start_time, 0, 5) && $nowTime <= substr($s->end_time, 0, 5);

                return [
                    'id'         => $s->id,
                    'day'        => $s->day,
                    'start_time' => substr($s->start_time ?? '', 0, 5),
                    'end_time'   => substr($s->end_time ?? '', 0, 5),
                    'subject'    => $s->subject ? [
                        'id'   => $s->subject->id,
                        'name' => $s->subject->name,
                        'code' => $s->subject->code ?? '',
                    ] : null,
                    'teacher'    => $s->teacher ? [
                        'id'   => $s->teacher->id,
                        'name' => $s->teacher->name,
                    ] : null,
                    'room'       => $s->room ?? 'Ruang Kelas',
                    'is_now'     => $isNow,
                    'is_today'   => $isToday,
                ];
            })->values();
        });

        $todaySchedule = $grouped[$todayId] ?? collect([]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Jadwal berhasil diambil.',
            'data'    => [
                'schedules'  => $grouped,
                'today'      => $todaySchedule->values(),
                'class'      => ['id' => $studentClass->id, 'name' => $studentClass->name],
                'today_name' => ucfirst($todayId),
            ],
        ], 200);
    }
}
