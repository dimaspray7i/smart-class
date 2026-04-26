<?php

namespace App\Services;

use App\Models\User;
use App\Models\Permission;
use App\Models\Schedule;
use App\Models\Attendance;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class TeacherService
{
    /**
     * Get teacher dashboard data
     */
    public function getDashboardData(int $teacherId): array
    {
        try {
            $user = User::with('profile')->find($teacherId);

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
                        'nip' => $user->profile?->nip,
                    ],
                    'stats' => $this->getDashboardStats($teacherId),
                    'pending_permissions' => $this->getPendingPermissions($teacherId),
                    'upcoming_classes' => $this->getUpcomingClasses($teacherId),
                    'today_attendance' => $this->getTodayAttendanceStats($teacherId),
                ],
            ];

        } catch (Exception $e) {
            Log::error('TeacherService::getDashboardData failed', [
                'teacher_id' => $teacherId,
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
    public function getDashboardStats(int $teacherId): array
    {
        // Get all classes taught by teacher
        $classIds = DB::table('class_user')
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->pluck('class_id');

        // Get all students
        $studentIds = DB::table('class_user')
            ->where('teacher_id', $teacherId)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true)
            ->pluck('user_id');

        $totalStudents = $studentIds->count();
        $totalClasses = $classIds->count();

        // Today's attendance
        $todayAttendance = Attendance::whereIn('user_id', $studentIds)
            ->where('date', today())
            ->get();

        $presentCount = $todayAttendance->whereIn('status', ['Hadir', 'Terlambat'])->count();
        $attendanceRate = $totalStudents > 0 ? round(($presentCount / $totalStudents) * 100, 2) : 0;

        return [
            'total_students' => $totalStudents,
            'total_classes' => $totalClasses,
            'today_attendance_rate' => $attendanceRate,
            'present_today' => $presentCount,
            'absent_today' => $totalStudents - $presentCount,
        ];
    }

    /**
     * Get pending permissions
     */
    public function getPendingPermissions(int $teacherId, int $limit = 5): array
    {
        return Permission::where('teacher_id', $teacherId)
            ->where('status', 'pending')
            ->with('student:id,name,email,avatar_url')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'student' => [
                        'id' => $permission->student->id,
                        'name' => $permission->student->name,
                        'avatar_url' => $permission->student->avatar_url,
                    ],
                    'type' => $permission->type,
                    'type_label' => $permission->type_label,
                    'date_range' => $permission->date_range,
                    'reason' => $permission->reason,
                    'created_at' => $permission->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }

    /**
     * Get upcoming classes today
     */
    public function getUpcomingClasses(int $teacherId): array
    {
        $day = now()->locale('id')->dayName;

        return Schedule::where('teacher_id', $teacherId)
            ->where('day', strtolower($day))
            ->where('start_time', '>=', now()->format('H:i'))
            ->where('is_active', true)
            ->orderBy('start_time')
            ->with(['class', 'subject'])
            ->limit(3)
            ->get()
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'subject' => $schedule->subject->name,
                    'class' => $schedule->class->name,
                    'time' => $schedule->time_range,
                    'room' => $schedule->room,
                    'is_now' => $schedule->is_now,
                ];
            })
            ->toArray();
    }

    /**
     * Get today's attendance statistics for teacher's students
     */
    public function getTodayAttendanceStats(int $teacherId): array
    {
        $studentIds = DB::table('class_user')
            ->where('teacher_id', $teacherId)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true)
            ->pluck('user_id');

        $todayAttendance = Attendance::whereIn('user_id', $studentIds)
            ->where('date', today())
            ->get();

        return [
            'total_students' => $studentIds->count(),
            'present' => $todayAttendance->whereIn('status', ['Hadir', 'Terlambat'])->count(),
            'absent' => $studentIds->count() - $todayAttendance->count(),
            'late' => $todayAttendance->where('status', 'Terlambat')->count(),
            'permission' => $todayAttendance->where('status', 'Izin')->count(),
            'sick' => $todayAttendance->where('status', 'Sakit')->count(),
        ];
    }

    /**
     * Get all students taught by teacher
     */
    public function getStudents(int $teacherId, ?int $classId = null): array
    {
        $query = DB::table('class_user')
            ->where('teacher_id', $teacherId)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true);

        if ($classId) {
            $query->where('class_id', $classId);
        }

        $students = $query->join('users', 'class_user.user_id', '=', 'users.id')
            ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.avatar_url',
                'profiles.nis',
                'profiles.class_level'
            )
            ->get();

        return $students->toArray();
    }

    /**
     * Get student attendance detail
     */
    public function getStudentAttendance(int $studentId, string $startDate, string $endDate): array
    {
        return Attendance::where('user_id', $studentId)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'desc')
            ->get()
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
}