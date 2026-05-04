<?php

namespace App\Services;

use App\Models\User;
use App\Models\Attendance;
use App\Models\ClassModel;
use App\Models\Project;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get comprehensive analytics
     */
    public function getAnalytics(array $filters): array
    {
        $startDate = $filters['start_date'] ?? Carbon::now()->subDays(30)->toDateString();
        $endDate = $filters['end_date'] ?? Carbon::now()->toDateString();

        return [
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'attendance' => $this->getAttendanceAnalytics($startDate, $endDate),
            'students' => $this->getStudentAnalytics($startDate, $endDate),
            'projects' => $this->getProjectAnalytics($startDate, $endDate),
            'classes' => $this->getClassAnalytics(),
        ];
    }

    /**
     * Attendance analytics
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
                $dailyStats[$date] = ['date' => $date, 'hadir' => 0, 'terlambat' => 0, 'izin' => 0, 'sakit' => 0, 'alpha' => 0];
            }
            $dailyStats[$date][strtolower($attendance->status)] = $attendance->count;
        }

        $totalStudents = User::where('role', 'siswa')->where('is_active', true)->count();
        $totalAttendance = Attendance::whereBetween('date', [$startDate, $endDate])->count();
        $presentCount = Attendance::whereBetween('date', [$startDate, $endDate])->whereIn('status', ['Hadir', 'Terlambat'])->count();

        return [
            'daily' => array_values($dailyStats),
            'summary' => [
                'total_students' => $totalStudents,
                'total_attendance' => $totalAttendance,
                'present' => $presentCount,
                'absent' => $totalStudents - $presentCount,
                'attendance_rate' => $totalStudents > 0 ? round(($presentCount / $totalStudents) * 100, 2) : 0,
            ],
        ];
    }

    /**
     * Student analytics
     */
    private function getStudentAnalytics(string $startDate, string $endDate): array
    {
        return [
            'new_students' => User::where('role', 'siswa')->whereBetween('created_at', [$startDate, $endDate])->count(),
            'active_students' => User::where('role', 'siswa')->where('is_active', true)->count(),
            'inactive_students' => User::where('role', 'siswa')->where('is_active', false)->count(),
            'by_level' => [
                'X' => User::where('role', 'siswa')->whereHas('profile', fn($q) => $q->where('class_level', 'X'))->count(),
                'XI' => User::where('role', 'siswa')->whereHas('profile', fn($q) => $q->where('class_level', 'XI'))->count(),
                'XII' => User::where('role', 'siswa')->whereHas('profile', fn($q) => $q->where('class_level', 'XII'))->count(),
            ],
        ];
    }

    /**
     * Project analytics
     */
    private function getProjectAnalytics(string $startDate, string $endDate): array
    {
        return [
            'total' => Project::count(),
            'new_projects' => Project::whereBetween('created_at', [$startDate, $endDate])->count(),
            'by_status' => [
                'planning' => Project::where('status', 'planning')->count(),
                'in_progress' => Project::where('status', 'in_progress')->count(),
                'completed' => Project::where('status', 'completed')->count(),
                'archived' => Project::where('status', 'archived')->count(),
            ],
            'completion_rate' => Project::count() > 0 ? round((Project::where('status', 'completed')->count() / Project::count()) * 100, 2) : 0,
        ];
    }

    /**
     * Class analytics
     */
    private function getClassAnalytics(): array
    {
        return [
            'total' => ClassModel::where('is_active', true)->count(),
            'by_level' => [
                'X' => ClassModel::where('level', 'X')->where('is_active', true)->count(),
                'XI' => ClassModel::where('level', 'XI')->where('is_active', true)->count(),
                'XII' => ClassModel::where('level', 'XII')->where('is_active', true)->count(),
            ],
        ];
    }
}