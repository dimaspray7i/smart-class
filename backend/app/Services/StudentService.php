<?php

namespace App\Services;

use App\Models\User;
use App\Models\Attendance;
use App\Models\Project;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Exception;

class StudentService
{
    /**
     * Get student dashboard data
     */
    public function getDashboardData(int $userId): array
    {
        try {
            $user = User::with(['profile', 'classes'])->find($userId);

            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'User tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'avatar_url' => $user->avatar_url,
                        'profile' => $user->profile,
                    ],
                    'stats' => $this->getDashboardStats($userId),
                    'today_schedule' => $this->getTodaySchedule($userId),
                    'quick_actions' => $this->getQuickActions($userId),
                    'recent_attendance' => $this->getRecentAttendance($userId),
                    'recent_projects' => $this->getRecentProjects($userId),
                ],
            ];

        } catch (Exception $e) {
            Log::error('StudentService::getDashboardData failed', [
                'user_id' => $userId,
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
     * Get dashboard statistics
     */
    public function getDashboardStats(int $userId): array
    {
        $attendanceStats = (new AttendanceService())->getStats($userId);

        return [
            'attendance' => [
                'total' => $attendanceStats['summary']['total'],
                'hadir' => $attendanceStats['summary']['hadir'],
                'percentage' => $attendanceStats['percentage']['hadir'],
                'streak' => $attendanceStats['streak'],
            ],
            'projects' => [
                'total' => Project::where('user_id', $userId)->count(),
                'completed' => Project::where('user_id', $userId)->where('status', 'completed')->count(),
                'in_progress' => Project::where('user_id', $userId)->where('status', 'in_progress')->count(),
            ],
            'skills' => [
                'total' => $userId ? User::find($userId)->skills()->count() : 0,
                'mastered' => \DB::table('student_skills')
                    ->where('user_id', $userId)
                    ->where('level', '>=', 80)
                    ->count(),
            ],
        ];
    }

    /**
     * Get today's schedule for student
     */
    public function getTodaySchedule(int $userId): array
    {
        $user = User::find($userId);
        $currentClass = $user->getCurrentClass();

        if (!$currentClass) {
            return [];
        }

        $day = now()->locale('id')->dayName;

        $schedules = Schedule::where('class_id', $currentClass->id)
            ->where('day', strtolower($day))
            ->where('is_active', true)
            ->orderBy('start_time')
            ->with(['subject', 'teacher'])
            ->get();

        return $schedules->map(function ($schedule) {
            return [
                'id' => $schedule->id,
                'subject' => $schedule->subject->name,
                'subject_code' => $schedule->subject->code,
                'teacher' => $schedule->teacher->name,
                'time' => $schedule->time_range,
                'room' => $schedule->room,
                'is_now' => $schedule->is_now,
            ];
        })->toArray();
    }

    /**
     * Get quick actions for student
     */
    public function getQuickActions(int $userId): array
    {
        $hasAttendedToday = Attendance::where('user_id', $userId)
            ->where('date', today())
            ->exists();

        $pendingProjects = Project::where('user_id', $userId)
            ->whereIn('status', ['planning', 'in_progress'])
            ->count();

        $openTime = config('app.attendance_open_time', '06:00');
        $closeTime = config('app.attendance_close_time', '16:00');
        $currentTime = now()->format('H:i');
        $canAttend = !$hasAttendedToday && $currentTime >= $openTime && $currentTime <= $closeTime;

        return [
            'can_attend' => $canAttend,
            'has_attended_today' => $hasAttendedToday,
            'has_pending_projects' => $pendingProjects > 0,
            'pending_projects_count' => $pendingProjects,
        ];
    }

    /**
     * Get recent attendance records
     */
    public function getRecentAttendance(int $userId, int $limit = 5): array
    {
        return Attendance::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->limit($limit)
            ->get(['date', 'status', 'created_at', 'lat', 'lng'])
            ->map(function ($attendance) {
                return [
                    'date' => $attendance->date_indonesian,
                    'status' => $attendance->status,
                    'time' => $attendance->check_in_time,
                    'location' => $attendance->location_string,
                ];
            })
            ->toArray();
    }

    /**
     * Get recent projects
     */
    public function getRecentProjects(int $userId, int $limit = 3): array
    {
        return Project::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get(['id', 'title', 'slug', 'status', 'created_at'])
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'title' => $project->title,
                    'slug' => $project->slug,
                    'status' => $project->status,
                    'status_label' => $project->status_label,
                    'created_at' => $project->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }
}