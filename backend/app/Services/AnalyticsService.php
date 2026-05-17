<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\PklLocation;
use App\Models\Schedule;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get general analytics data
     */
    public function getAnalytics(array $params = []): array
    {
        $startDate = $params['start_date'] ?? Carbon::now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? Carbon::now()->toDateString();
        $metric = $params['metric'] ?? 'all';
        $groupBy = $params['group_by'] ?? 'day';

        $analytics = [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
                'days' => Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1,
            ],
            'summary' => $this->getSummaryStats($startDate, $endDate, $metric),
            'daily' => $this->getDailyBreakdown($startDate, $endDate, $groupBy),
            'trends' => $this->getTrendData($startDate, $endDate),
        ];

        return $analytics;
    }

    /**
     * Get attendance-specific analytics
     */
    public function getAttendanceAnalytics(array $params = []): array
    {
        $startDate = $params['start_date'] ?? Carbon::now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? Carbon::now()->toDateString();
        $classId = $params['class_id'] ?? null;
        $teacherId = $params['teacher_id'] ?? null;

        $query = Attendance::query()
            ->whereBetween('date', [$startDate, $endDate]);

        if ($classId) {
            $query->whereHas('user.classes', fn($q) => $q->where('classes.id', $classId));
        }

        if ($teacherId) {
            $query->whereHas('session', fn($q) => $q->where('teacher_id', $teacherId));
        }

        $total = $query->count();
        $hadir = $query->clone()->where('status', 'Hadir')->count();
        $terlambat = $query->clone()->where('status', 'Terlambat')->count();
        $izin = $query->clone()->where('status', 'Izin')->count();
        $sakit = $query->clone()->where('status', 'Sakit')->count();
        $alpha = $query->clone()->where('status', 'Alpha')->count();

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => [
                'total' => $total,
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'izin' => $izin,
                'sakit' => $sakit,
                'alpha' => $alpha,
                'attendance_rate' => $total > 0 ? round(($hadir / $total) * 100, 2) : 0,
                'on_time_rate' => $hadir > 0 ? round((($hadir - $terlambat) / $hadir) * 100, 2) : 0,
            ],
            'by_status' => [
                ['status' => 'Hadir', 'count' => $hadir, 'percentage' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0],
                ['status' => 'Terlambat', 'count' => $terlambat, 'percentage' => $total > 0 ? round(($terlambat / $total) * 100, 1) : 0],
                ['status' => 'Izin', 'count' => $izin, 'percentage' => $total > 0 ? round(($izin / $total) * 100, 1) : 0],
                ['status' => 'Sakit', 'count' => $sakit, 'percentage' => $total > 0 ? round(($sakit / $total) * 100, 1) : 0],
                ['status' => 'Alpha', 'count' => $alpha, 'percentage' => $total > 0 ? round(($alpha / $total) * 100, 1) : 0],
            ],
            'daily' => $this->getAttendanceDaily($startDate, $endDate, $classId),
            'by_class' => $this->getAttendanceByClass($startDate, $endDate),
            'by_hour' => $this->getAttendanceByHour($startDate, $endDate),
        ];
    }

    /**
     * Get student-specific analytics
     */
    public function getStudentAnalytics(array $params = []): array
    {
        $startDate = $params['start_date'] ?? Carbon::now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? Carbon::now()->toDateString();
        $classLevel = $params['class_level'] ?? null;
        $role = $params['role'] ?? 'siswa';

        $query = User::query()->where('role', $role);

        if ($classLevel) {
            $query->whereHas('profile', fn($q) => $q->where('class_level', $classLevel));
        }

        $total = $query->count();
        $active = $query->clone()->where('is_active', true)->count();

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => [
                'total_students' => $total,
                'active_students' => $active,
                'inactive_students' => $total - $active,
                'activation_rate' => $total > 0 ? round(($active / $total) * 100, 2) : 0,
            ],
            'by_class_level' => $this->getStudentsByClassLevel($classLevel),
            'by_registration_date' => $this->getStudentsByRegistrationDate($startDate, $endDate),
            'attendance_summary' => $this->getStudentAttendanceSummary($startDate, $endDate),
        ];
    }

    /**
     * Get class-specific analytics
     */
    public function getClassAnalytics(array $params = []): array
    {
        $startDate = $params['start_date'] ?? Carbon::now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? Carbon::now()->toDateString();
        $classId = $params['class_id'] ?? null;

        $query = ClassModel::query();
        if ($classId) {
            $query->where('id', $classId);
        }

        $classes = $query->withCount(['students', 'schedules'])->get();

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => [
                'total_classes' => $classes->count(),
                'total_students' => $classes->sum('students_count'),
                'total_schedules' => $classes->sum('schedules_count'),
                'avg_students_per_class' => $classes->count() > 0 
                    ? round($classes->sum('students_count') / $classes->count(), 1) 
                    : 0,
            ],
            'classes' => $classes->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'level' => $c->level,
                'student_count' => $c->students_count,
                'schedule_count' => $c->schedules_count,
                'capacity_utilization' => $c->capacity > 0 
                    ? round(($c->students_count / $c->capacity) * 100, 1) 
                    : 0,
            ]),
            'attendance_by_class' => $this->getClassAttendanceStats($startDate, $endDate, $classId),
        ];
    }

    /**
     * Get subject-specific analytics
     */
    public function getSubjectAnalytics(array $params = []): array
    {
        $startDate = $params['start_date'] ?? Carbon::now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? Carbon::now()->toDateString();
        $category = $params['category'] ?? null;

        $query = Subject::query();
        if ($category) {
            $query->where('category', $category);
        }

        $subjects = $query->withCount(['schedules', 'classes'])->get();

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => [
                'total_subjects' => $subjects->count(),
                'productive' => $subjects->where('category', 'productive')->count(),
                'normative' => $subjects->where('category', 'normative')->count(),
                'adaptive' => $subjects->where('category', 'adaptive')->count(),
                'total_schedules' => $subjects->sum('schedules_count'),
            ],
            'by_category' => [
                ['category' => 'productive', 'count' => $subjects->where('category', 'productive')->count()],
                ['category' => 'normative', 'count' => $subjects->where('category', 'normative')->count()],
                ['category' => 'adaptive', 'count' => $subjects->where('category', 'adaptive')->count()],
            ],
            'most_scheduled' => $subjects->sortByDesc('schedules_count')->take(5)->values(),
        ];
    }

    /**
     * Get PKL/internship analytics
     */
    public function getPklAnalytics(array $params = []): array
    {
        $startDate = $params['start_date'] ?? Carbon::now()->startOfMonth()->toDateString();
        $endDate = $params['end_date'] ?? Carbon::now()->toDateString();
        $status = $params['status'] ?? null;

        $query = PklLocation::query();
        if ($status !== null) {
            $query->where('is_approved', $status === 'approved');
        }

        $locations = $query->withCount(['students' => fn($q) => $q->where('role', 'siswa')])->get();

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'summary' => [
                'total_locations' => $locations->count(),
                'approved_locations' => $locations->where('is_approved', true)->count(),
                'pending_locations' => $locations->where('is_approved', false)->count(),
                'total_students_pkl' => $locations->sum('students_count'),
            ],
            'locations' => $locations->map(fn($loc) => [
                'id' => $loc->id,
                'company_name' => $loc->company_name,
                'is_approved' => $loc->is_approved,
                'student_count' => $loc->students_count,
                'city' => $loc->city ?? 'Unknown',
            ]),
            'attendance_summary' => $this->getPklAttendanceSummary($startDate, $endDate),
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    private function getSummaryStats(string $start, string $end, string $metric): array
    {
        return [
            'total_users' => User::count(),
            'total_classes' => ClassModel::count(),
            'total_subjects' => Subject::count(),
            'total_attendance' => Attendance::whereBetween('date', [$start, $end])->count(),
            'attendance_today' => Attendance::where('date', today())->count(),
        ];
    }

    private function getDailyBreakdown(string $start, string $end, string $groupBy): array
    {
        $results = Attendance::query()
            ->selectRaw("DATE(date) as date, 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END) as hadir,
                        SUM(CASE WHEN status = 'Terlambat' THEN 1 ELSE 0 END) as terlambat,
                        SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END) as izin,
                        SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END) as sakit,
                        SUM(CASE WHEN status = 'Alpha' THEN 1 ELSE 0 END) as alpha")
            ->whereBetween('date', [$start, $end])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return $results->map(fn($r) => [
            'date' => $r->date,
            'total' => (int) $r->total,
            'hadir' => (int) $r->hadir,
            'terlambat' => (int) $r->terlambat,
            'izin' => (int) $r->izin,
            'sakit' => (int) $r->sakit,
            'alpha' => (int) $r->alpha,
        ])->toArray();
    }

    private function getTrendData(string $start, string $end): array
    {
        // Simple trend calculation (can be enhanced with ML later)
        $current = Attendance::whereBetween('date', [$start, $end])->count();
        $previousStart = Carbon::parse($start)->subDays(30)->toDateString();
        $previousEnd = Carbon::parse($start)->subDay()->toDateString();
        $previous = Attendance::whereBetween('date', [$previousStart, $previousEnd])->count();

        $change = $previous > 0 ? round((($current - $previous) / $previous) * 100, 1) : 0;

        return [
            'current_period' => $current,
            'previous_period' => $previous,
            'change_percentage' => $change,
            'trend' => $change > 0 ? 'up' : ($change < 0 ? 'down' : 'stable'),
        ];
    }

    private function getAttendanceDaily(string $start, string $end, ?int $classId): array
    {
        $query = Attendance::query()
            ->selectRaw("DATE(date) as date, status, COUNT(*) as count")
            ->whereBetween('date', [$start, $end]);

        if ($classId) {
            $query->whereHas('user.classes', fn($q) => $q->where('classes.id', $classId));
        }

        return $query->groupBy('date', 'status')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(fn($items) => [
                'date' => $items->first()->date,
                'hadir' => $items->where('status', 'Hadir')->first()?->count ?? 0,
                'terlambat' => $items->where('status', 'Terlambat')->first()?->count ?? 0,
                'izin' => $items->where('status', 'Izin')->first()?->count ?? 0,
                'sakit' => $items->where('status', 'Sakit')->first()?->count ?? 0,
                'alpha' => $items->where('status', 'Alpha')->first()?->count ?? 0,
            ])
            ->values()
            ->toArray();
    }

    private function getAttendanceByClass(string $start, string $end): array
    {
        return DB::table('attendances')
            ->join('users', 'attendances.user_id', '=', 'users.id')
            ->join('class_user', 'users.id', '=', 'class_user.user_id')
            ->join('classes', 'class_user.class_id', '=', 'classes.id')
            ->selectRaw('classes.name as class_name, 
                       COUNT(*) as total,
                       SUM(CASE WHEN attendances.status = "Hadir" THEN 1 ELSE 0 END) as hadir')
            ->whereBetween('attendances.date', [$start, $end])
            ->where('class_user.is_active', true)
            ->groupBy('classes.id', 'classes.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->toArray();
    }

    private function getAttendanceByHour(string $start, string $end): array
    {
        return Attendance::query()
            ->selectRaw("HOUR(created_at) as hour, COUNT(*) as count")
            ->whereBetween('date', [$start, $end])
            ->whereNotNull('created_at')
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->map(fn($r) => ['hour' => (int) $r->hour, 'count' => (int) $r->count])
            ->toArray();
    }

    private function getStudentsByClassLevel(?string $filter): array
    {
        $query = User::query()->where('role', 'siswa');
        if ($filter) {
            $query->whereHas('profile', fn($q) => $q->where('class_level', $filter));
        }

        return DB::table('users')
            ->join('profiles', 'users.id', '=', 'profiles.user_id')
            ->selectRaw('profiles.class_level, COUNT(*) as count')
            ->where('users.role', 'siswa')
            ->groupBy('profiles.class_level')
            ->orderBy('profiles.class_level')
            ->get()
            ->toArray();
    }

    private function getStudentsByRegistrationDate(string $start, string $end): array
    {
        return User::query()
            ->where('role', 'siswa')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("DATE(created_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'count' => (int) $r->count])
            ->toArray();
    }

    private function getStudentAttendanceSummary(string $start, string $end): array
    {
        return DB::table('attendances')
            ->selectRaw('status, COUNT(*) as count')
            ->whereBetween('date', [$start, $end])
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => (int) $r->count])
            ->toArray();
    }

    private function getClassAttendanceStats(string $start, string $end, ?int $classId): array
    {
        $query = DB::table('attendances')
            ->join('users', 'attendances.user_id', '=', 'users.id')
            ->join('class_user', 'users.id', '=', 'class_user.user_id')
            ->join('classes', 'class_user.class_id', '=', 'classes.id')
            ->selectRaw('classes.name, 
                       COUNT(*) as total,
                       SUM(CASE WHEN attendances.status = "Hadir" THEN 1 ELSE 0 END) as hadir,
                       ROUND(SUM(CASE WHEN attendances.status = "Hadir" THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as rate')
            ->whereBetween('attendances.date', [$start, $end])
            ->where('class_user.is_active', true);

        if ($classId) {
            $query->where('classes.id', $classId);
        }

        return $query->groupBy('classes.id', 'classes.name')
            ->orderByDesc('rate')
            ->get()
            ->toArray();
    }

    private function getPklAttendanceSummary(string $start, string $end): array
    {
        // PKL attendance uses same attendance table but filtered by class_level = XII
        return DB::table('attendances')
            ->join('users', 'attendances.user_id', '=', 'users.id')
            ->join('profiles', 'users.id', '=', 'profiles.user_id')
            ->selectRaw('attendances.status, COUNT(*) as count')
            ->whereBetween('attendances.date', [$start, $end])
            ->where('profiles.class_level', 'XII')
            ->groupBy('attendances.status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => (int) $r->count])
            ->toArray();
    }
}