<?php

namespace App\Services;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class AdminService
{
    /**
     * Get admin dashboard data
     */
    public function getDashboardData(): array
    {
        try {
            return [
                'success' => true,
                'data' => [
                    'overview' => $this->getOverview(),
                    'system_health' => $this->getSystemHealth(),
                    'recent_activity' => $this->getRecentActivity(),
                ],
            ];
        } catch (Exception $e) {
            Log::error('AdminService::getDashboardData failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat data dashboard.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get system overview
     */
    public function getOverview(): array
    {
        try {
            // OPTIMIZED: Consolidate user counts into 1 query
            $userStats = User::select(
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count"),
                DB::raw("SUM(CASE WHEN role = 'guru' THEN 1 ELSE 0 END) as guru_count"),
                DB::raw("SUM(CASE WHEN role = 'siswa' THEN 1 ELSE 0 END) as siswa_count")
            )->first();

            return [
                'users' => [
                    'total' => $userStats->total ?? 0,
                    'admin' => $userStats->admin_count ?? 0,
                    'guru' => $userStats->guru_count ?? 0,
                    'siswa' => $userStats->siswa_count ?? 0,
                ],
                'classes' => ClassModel::count(),
                'subjects' => Subject::count(),
                'schedules' => Schedule::count(),
                'attendance_today' => Attendance::whereDate('date', today())->count(),
            ];
        } catch (Exception $e) {
            Log::error('AdminService::getOverview failed', [
                'error' => $e->getMessage(),
            ]);
            // Return safe defaults
            return [
                'users' => ['total' => 0, 'admin' => 0, 'guru' => 0, 'siswa' => 0],
                'classes' => 0,
                'subjects' => 0,
                'schedules' => 0,
                'attendance_today' => 0,
            ];
        }
    }

    /**
     * Get system health status
     */
    public function getSystemHealth(): array
    {
        try {
            return [
                'database' => [
                    'status' => 'connected',
                    'driver' => \DB::connection()->getDriverName(),
                ],
                'cache' => [
                    'status' => config('cache.default'),
                ],
                'queue' => [
                    'status' => config('queue.default'),
                ],
                'app' => [
                    'status' => 'running',
                    'environment' => config('app.env'),
                ],
            ];
        } catch (Exception $e) {
            Log::error('AdminService::getSystemHealth failed', [
                'error' => $e->getMessage(),
            ]);
            return [
                'database' => ['status' => 'unknown'],
                'cache' => ['status' => 'unknown'],
                'queue' => ['status' => 'unknown'],
                'app' => ['status' => 'unknown'],
            ];
        }
    }

    /**
     * Get recent activity
     */
    public function getRecentActivity(): array
    {
        try {
            return [
                'recent_users' => User::latest('created_at')->limit(5)->get(['id', 'name', 'email', 'role', 'created_at'])->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'created_at' => $user->created_at,
                    ];
                })->toArray(),
                'recent_attendance' => Attendance::with('user:id,name')
                    ->latest('created_at')
                    ->limit(5)
                    ->get()
                    ->map(function ($attendance) {
                        return [
                            'id' => $attendance->id,
                            'user_id' => $attendance->user_id,
                            'user_name' => optional($attendance->user)->name ?? 'Unknown',
                            'date' => $attendance->date,
                            'status' => $attendance->status,
                            'created_at' => $attendance->created_at,
                        ];
                    })->toArray(),
            ];
        } catch (Exception $e) {
            Log::error('AdminService::getRecentActivity failed', [
                'error' => $e->getMessage(),
            ]);
            return [
                'recent_users' => [],
                'recent_attendance' => [],
            ];
        }
    }

    /**
     * Get analytics data
     */
    public function getAnalytics(array $filters): array
    {
        $startDate = $filters['start_date'] ?? Carbon::now()->subDays(30)->toDateString();
        $endDate = $filters['end_date'] ?? Carbon::now()->toDateString();
        $metric = $filters['metric'] ?? 'attendance';

        if ($metric === 'attendance') {
            return $this->getAttendanceAnalytics($startDate, $endDate);
        }

        if ($metric === 'students') {
            return $this->getStudentAnalytics($startDate, $endDate);
        }

        return [];
    }

    /**
     * Get attendance analytics
     */
    private function getAttendanceAnalytics(string $startDate, string $endDate): array
    {
        $attendances = Attendance::whereBetween('date', [$startDate, $endDate])
            ->selectRaw('date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->get();

        $dailyStats = [];
        foreach ($attendances as $attendance) {
            $date = $attendance->date->toDateString();
            if (!isset($dailyStats[$date])) {
                $dailyStats[$date] = [
                    'date' => $date,
                    'hadir' => 0,
                    'terlambat' => 0,
                    'izin' => 0,
                    'sakit' => 0,
                    'alpha' => 0,
                ];
            }
            $status = strtolower($attendance->status);
            $dailyStats[$date][$status] = $attendance->count;
        }

        return [
            'metric' => 'attendance',
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'data' => array_values($dailyStats),
        ];
    }

    /**
     * Get student analytics
     */
    private function getStudentAnalytics(string $startDate, string $endDate): array
    {
        $newStudents = User::where('role', 'siswa')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        $activeStudents = User::where('role', 'siswa')
            ->where('is_active', true)
            ->count();

        return [
            'metric' => 'students',
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'data' => [
                'new_students' => $newStudents,
                'active_students' => $activeStudents,
                'inactive_students' => User::where('role', 'siswa')->where('is_active', false)->count(),
            ],
        ];
    }
}