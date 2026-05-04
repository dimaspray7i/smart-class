<?php

namespace App\Services;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
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
        return [
            'users' => [
                'total' => User::count(),
                'admin' => User::where('role', 'admin')->count(),
                'guru' => User::where('role', 'guru')->count(),
                'siswa' => User::where('role', 'siswa')->count(),
            ],
            'classes' => ClassModel::where('is_active', true)->count(),
            'subjects' => Subject::where('is_active', true)->count(),
            'schedules' => Schedule::where('is_active', true)->count(),
            'attendance_today' => Attendance::where('date', today())->count(),
        ];
    }

    /**
     * Get system health status
     */
    public function getSystemHealth(): array
    {
        return [
            'database' => [
                'status' => 'connected',
                'driver' => \DB::connection()->getDriverName(),
                'default' => config('database.default'),
            ],
            'cache' => [
                'status' => config('cache.default'),
                'driver' => config('cache.stores.' . config('cache.default') . '.driver'),
            ],
            'queue' => [
                'status' => config('queue.default'),
                'connection' => config('queue.connections.' . config('queue.default') . '.driver'),
            ],
            'storage' => [
                'disk' => config('filesystems.default'),
                'public_path' => storage_path('app/public'),
            ],
        ];
    }

    /**
     * Get recent activity
     */
    public function getRecentActivity(): array
    {
        return [
            'recent_users' => User::latest()->limit(5)->get(['id', 'name', 'email', 'role', 'created_at']),
            'recent_attendance' => Attendance::with('user:id,name')
                ->latest()
                ->limit(5)
                ->get(['id', 'user_id', 'date', 'status', 'created_at']),
        ];
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