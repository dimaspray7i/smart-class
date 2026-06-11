<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Schedule;

class ScheduleController extends Controller
{
    // Mapping nama hari dalam Bahasa Indonesia (enum DB) ke English (Carbon format)
    private const DAY_TO_EN = [
        'senin'  => 'Monday',
        'selasa' => 'Tuesday',
        'rabu'   => 'Wednesday',
        'kamis'  => 'Thursday',
        'jumat'  => 'Friday',
        'sabtu'  => 'Saturday',
    ];

    // Urutan hari untuk sorting
    private const DAY_ORDER = [
        'senin'  => 1,
        'selasa' => 2,
        'rabu'   => 3,
        'kamis'  => 4,
        'jumat'  => 5,
        'sabtu'  => 6,
    ];

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get student's active class - coba berbagai kombinasi pivot filter
        $studentClass = $this->getStudentClass($user);

        if (!$studentClass) {
            return response()->json([
                'status'  => 'success',
                'message' => 'Jadwal berhasil diambil. Anda belum terdaftar di kelas manapun.',
                'data'    => [
                    'schedules'  => [],
                    'today'      => [],
                    'class'      => null,
                    'today_name' => null,
                ],
            ], 200);
        }

        // Build query - kolom DB adalah `day`, bukan `day_of_week`
        $query = Schedule::with(['subject', 'teacher'])
            ->where('class_id', $studentClass->id)
            ->where('is_active', true);

        // Filter by day jika ada parameter
        if ($request->filled('day')) {
            $query->where('day', strtolower($request->day));
        }

        // Order by day (manual sort) dan start_time
        $schedules = $query->orderBy('start_time')->get();

        // Sort by day order custom
        $schedules = $schedules->sortBy(function ($s) {
            return (self::DAY_ORDER[strtolower($s->day)] ?? 99) . $s->start_time;
        })->values();

        // Tentukan hari ini dalam Bahasa Indonesia (lowercase - sesuai enum DB)
        $todayEn  = now()->format('l'); // Monday, Tuesday, etc.
        $todayId  = array_search($todayEn, self::DAY_TO_EN) ?: 'senin';
        $nowTime  = now()->format('H:i');

        // Group jadwal berdasarkan kolom `day`
        $grouped = $schedules->groupBy('day')->map(function ($items, $dayKey) use ($todayId, $nowTime) {
            return $items->map(function ($s) use ($todayId, $nowTime) {
                $isToday = strtolower($s->day) === strtolower($todayId);
                
                $startTime = $s->start_time instanceof \Carbon\Carbon
                    ? $s->start_time->format('H:i')
                    : substr((string)$s->start_time, 0, 5);
                
                $endTime = $s->end_time instanceof \Carbon\Carbon
                    ? $s->end_time->format('H:i')
                    : substr((string)$s->end_time, 0, 5);
                
                $isNow = $isToday && $nowTime >= $startTime && $nowTime <= $endTime;

                return [
                    'id'         => $s->id,
                    'day'        => $s->day,        // Kolom aktual: `day`
                    'start_time' => $startTime,
                    'end_time'   => $endTime,
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

        // Ambil jadwal hari ini
        $todaySchedule = $grouped[$todayId] ?? collect([]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Jadwal berhasil diambil.',
            'data'    => [
                'schedules'  => $grouped,
                'today'      => $todaySchedule->values(),
                'class'      => ['id' => $studentClass->id, 'name' => $studentClass->name],
                'today_name' => $todayId,
            ],
        ], 200);
    }

    /**
     * Coba berbagai kombinasi filter pivot untuk mendapatkan kelas siswa.
     * Fallback jika academic_year tidak cocok (seed data tahun lama).
     */
    private function getStudentClass($user)
    {
        // Coba 1: Filter lengkap (academic_year = tahun ini)
        $class = $user->classes()
            ->wherePivot('is_active', true)
            ->wherePivot('role_in_class', 'siswa')
            ->wherePivot('academic_year', date('Y'))
            ->first();

        if ($class) return $class;

        // Coba 2: Tanpa filter academic_year (data lama / seed tahun sebelumnya)
        $class = $user->classes()
            ->wherePivot('is_active', true)
            ->wherePivot('role_in_class', 'siswa')
            ->first();

        if ($class) return $class;

        // Coba 3: Tanpa filter is_active (mungkin belum diset)
        $class = $user->classes()
            ->wherePivot('role_in_class', 'siswa')
            ->first();

        return $class;
    }
}
