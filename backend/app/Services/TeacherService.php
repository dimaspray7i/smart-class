<?php

namespace App\Services;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Subject;
use App\Models\Schedule;
use App\Models\Attendance;
use App\Models\Permission;
use App\Models\AttendanceSession;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class TeacherService
{
    /**
     * 📊 Get comprehensive dashboard data for teacher
     */
    public function getDashboardData(int $teacherId, array $filters = []): array
    {
        try {
            $user = User::with(['profile'])->find($teacherId);

            if (!$user || $user->role !== 'guru') {
                return [
                    'success' => false,
                    'message' => 'User guru tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $cacheKey = "teacher_dashboard_{$teacherId}_" . md5(json_encode($filters));
            
            // Try cache first (5 minutes)
            if (empty($filters)) {
                $cached = Cache::get($cacheKey);
                if ($cached) {
                    return ['success' => true, 'data' => $cached];
                }
            }

            // Get classes taught by teacher
            $classIds = $this->getTeacherClassIds($teacherId);
            $subjectIds = $this->getTeacherSubjectIds($teacherId);
            $studentIds = $this->getTeacherStudentIds($teacherId, $classIds);

            // Calculate stats
            $stats = $this->calculateDashboardStats($teacherId, $classIds, $studentIds, $filters);

            // Get pending permissions (limited for performance)
            $pendingPermissions = Permission::where('status', 'pending')
                ->whereHas('student', function ($q) use ($studentIds) {
                    $q->whereIn('id', $studentIds);
                })
                ->with(['student.user' => fn($q) => $q->select('id', 'name', 'avatar_url')])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'student' => [
                        'id' => $p->student->id,
                        'name' => $p->student->user?->name,
                        'avatar_url' => $p->student->user?->avatar_url,
                    ],
                    'type' => $p->type,
                    'type_label' => $p->type_label,
                    'date_from' => $p->date_from,
                    'date_to' => $p->date_to,
                    'reason' => $p->reason,
                    'created_at' => $p->created_at->diffForHumans(),
                ]);

            // Get today's schedule
            $todaySchedule = $this->getTodaySchedule($teacherId);

            // Get active attendance sessions
            $activeSessions = AttendanceSession::active()
                ->where('generated_by', $teacherId)
                ->with(['class'])
                ->withCount([
                    'attendances as present_count' => fn($q) => $q->where('status', 'Hadir'),
                    'attendances as late_count' => fn($q) => $q->where('status', 'Terlambat'),
                ])
                ->get()
                ->map(function ($session) {
                    $session->total_students = $session->class ? $session->class->students()->count() : 0;
                    return $session;
                });

            $data = [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'avatar_url' => $user->avatar_url,
                    'profile' => $user->profile?->only(['nip', 'phone', 'bio']),
                ],
                'stats' => $stats,
                'pending_permissions' => $pendingPermissions,
                'pending_permissions_count' => Permission::where('status', 'pending')
                    ->whereHas('student', fn($q) => $q->whereIn('id', $studentIds))
                    ->count(),
                'today_schedule' => $todaySchedule,
                'active_sessions' => $activeSessions,
                'quick_actions' => $this->getQuickActions($teacherId),
            ];

            // Cache if no filters
            if (empty($filters)) {
                Cache::put($cacheKey, $data, now()->addMinutes(5));
            }

            return [
                'success' => true,
                'data' => $data,
            ];

        } catch (Exception $e) {
            Log::error('TeacherService::getDashboardData failed', [
                'teacher_id' => $teacherId,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat data dashboard.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * 📈 Get analytics data for charts & reports
     */
    public function getAnalytics(int $teacherId, array $filters = []): array
    {
        try {
            $period = $filters['period'] ?? 'monthly';
            $startDate = $filters['start_date'] ?? $this->getPeriodStart($period);
            $endDate = $filters['end_date'] ?? now()->toDateString();
            $classId = $filters['class_id'] ?? null;

            $studentIds = $this->getTeacherStudentIds($teacherId, $classId ? [$classId] : null);

            // Attendance analytics
            $attendanceData = Attendance::whereIn('user_id', $studentIds)
                ->whereBetween('date', [$startDate, $endDate])
                ->selectRaw('date, status, count(*) as count')
                ->groupBy('date', 'status')
                ->orderBy('date')
                ->get()
                ->groupBy('date');

            // Permission analytics
            $permissionData = Permission::whereHas('student', fn($q) => $q->whereIn('id', $studentIds))
                ->whereBetween('date_from', [$startDate, $endDate])
                ->selectRaw('status, type, count(*) as count')
                ->groupBy('status', 'type')
                ->get()
                ->groupBy('status');

            // Class performance
            $classPerformance = ClassModel::whereIn('id', $this->getTeacherClassIds($teacherId))
                ->when($classId, fn($q) => $q->where('id', $classId))
                ->withCount(['students'])
                ->get()
                ->map(function ($class) use ($studentIds, $startDate, $endDate) {
                    $classStudentIds = $class->students()->pluck('id')->intersect($studentIds);
                    $attendance = Attendance::whereIn('user_id', $classStudentIds)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->get();
                    
                    $total = $attendance->count();
                    $present = $attendance->whereIn('status', ['Hadir', 'Terlambat'])->count();
                    
                    return [
                        'id' => $class->id,
                        'name' => $class->name,
                        'students_count' => $classStudentIds->count(),
                        'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 2) : 0,
                        'present' => $present,
                        'absent' => $total - $present,
                    ];
                });

            return [
                'success' => true,
                'data' => [
                    'period' => $period,
                    'date_range' => [
                        'start' => $startDate,
                        'end' => $endDate,
                    ],
                    'attendance_chart' => $this->formatAttendanceChart($attendanceData, $startDate, $endDate),
                    'permission_chart' => $this->formatPermissionChart($permissionData),
                    'class_performance' => $classPerformance,
                    'summary' => [
                        'total_attendance_records' => collect($attendanceData)->sum(fn($day) => $day->sum('count')),
                        'average_attendance_rate' => $classPerformance->avg('attendance_rate') ?? 0,
                        'total_permissions' => $permissionData->flatten(1)->sum('count'),
                        'approval_rate' => $this->calculateApprovalRate($permissionData),
                    ],
                ],
            ];

        } catch (Exception $e) {
            Log::error('TeacherService::getAnalytics failed', [
                'teacher_id' => $teacherId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat analytics.',
                'code' => 'ANALYTICS_ERROR',
            ];
        }
    }

    /**
     * 📤 Export data to various formats
     */
    public function exportData(int $teacherId, array $params): array
    {
        try {
            $format = $params['format'];
            $dataType = $params['data_type'];
            $startDate = $params['start_date'] ?? now()->subMonth()->toDateString();
            $endDate = $params['end_date'] ?? now()->toDateString();
            $classId = $params['class_id'] ?? null;

            $studentIds = $this->getTeacherStudentIds($teacherId, $classId ? [$classId] : null);

            $data = [];
            $filename = '';
            $contentType = '';

            switch ($dataType) {
                case 'attendance':
                    $data = $this->exportAttendanceData($studentIds, $startDate, $endDate);
                    $filename = "attendance-export-" . date('Y-m-d') . ".{$format}";
                    $contentType = $this->getContentType($format);
                    break;
                    
                case 'permissions':
                    $data = $this->exportPermissionData($studentIds, $startDate, $endDate);
                    $filename = "permissions-export-" . date('Y-m-d') . ".{$format}";
                    $contentType = $this->getContentType($format);
                    break;
                    
                case 'students':
                    $data = $this->exportStudentData($studentIds);
                    $filename = "students-export-" . date('Y-m-d') . ".{$format}";
                    $contentType = $this->getContentType($format);
                    break;
                    
                case 'all':
                default:
                    $data = [
                        'attendance' => $this->exportAttendanceData($studentIds, $startDate, $endDate),
                        'permissions' => $this->exportPermissionData($studentIds, $startDate, $endDate),
                        'students' => $this->exportStudentData($studentIds),
                        'exported_at' => now()->toDateTimeString(),
                    ];
                    $filename = "teacher-export-all-" . date('Y-m-d') . ".{$format}";
                    $contentType = $this->getContentType($format);
                    break;
            }

            // Format output based on format type
            if ($format === 'json') {
                return [
                    'success' => true,
                    'data' => $data,
                ];
            }

            $fileContent = $this->formatExport($data, $format);

            return [
                'success' => true,
                'file_content' => $fileContent,
                'filename' => $filename,
                'content_type' => $contentType,
            ];

        } catch (Exception $e) {
            Log::error('TeacherService::exportData failed', [
                'teacher_id' => $teacherId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal export data.',
                'code' => 'EXPORT_ERROR',
            ];
        }
    }

    /**
     * 🔔 Get notifications for teacher
     */
    public function getNotifications(int $teacherId, int $limit = 10, bool $unreadOnly = false): array
    {
        // This would integrate with a notifications system
        // For now, return mock data based on pending items
        
        $pendingCount = Permission::where('status', 'pending')
            ->whereHas('student', fn($q) => $q->whereIn('id', $this->getTeacherStudentIds($teacherId)))
            ->count();

        $activeSessions = AttendanceSession::active()
            ->where('generated_by', $teacherId)
            ->count();

        $notifications = [];

        if ($pendingCount > 0) {
            $notifications[] = [
                'id' => "perm_{$pendingCount}",
                'type' => 'permission_pending',
                'title' => 'Izin Menunggu Persetujuan',
                'message' => "Ada {$pendingCount} permohonan izin yang menunggu persetujuan Anda.",
                'priority' => 'high',
                'read' => false,
                'created_at' => now()->toDateTimeString(),
                'action_url' => '/dashboard/teacher/permissions',
                'icon' => 'Bell',
            ];
        }

        if ($activeSessions > 0) {
            $notifications[] = [
                'id' => "session_{$activeSessions}",
                'type' => 'active_session',
                'title' => 'Sesi Absensi Aktif',
                'message' => "Ada {$activeSessions} sesi absensi yang sedang berlangsung.",
                'priority' => 'medium',
                'read' => false,
                'created_at' => now()->toDateTimeString(),
                'action_url' => '/dashboard/teacher/attendance',
                'icon' => 'CalendarCheck',
            ];
        }

        if ($unreadOnly) {
            $notifications = array_filter($notifications, fn($n) => !$n['read']);
        }

        return array_slice($notifications, 0, $limit);
    }

    /**
     * ✅ Mark notification as read
     */
    public function markNotificationRead(int $teacherId, int $notificationId): array
    {
        // In a real app, this would update a notifications table
        // For now, just return success
        return [
            'success' => true,
            'message' => 'Notifikasi telah ditandai sebagai dibaca.',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // 🔧 HELPER METHODS (Private)
    // ═══════════════════════════════════════════════════════════

    /**
     * Get class IDs taught by teacher
     */
    private function getTeacherClassIds(int $teacherId): array
    {
        return DB::table('class_user')
            ->where('user_id', $teacherId)
            ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
            ->where('is_active', true)
            ->pluck('class_id')
            ->toArray();
    }

    /**
     * Get subject IDs taught by teacher
     */
    private function getTeacherSubjectIds(int $teacherId): array
    {
        return DB::table('profile_subject')
            ->join('profiles', 'profile_subject.profile_id', '=', 'profiles.id')
            ->where('profiles.user_id', $teacherId)
            ->pluck('profile_subject.subject_id')
            ->toArray();
    }

    /**
     * Get student IDs taught by teacher
     */
    private function getTeacherStudentIds(int $teacherId, ?array $classIds = null): array
    {
        if (empty($classIds)) {
            $classIds = $this->getTeacherClassIds($teacherId);
        }

        if (empty($classIds)) {
            return [];
        }

        return DB::table('class_user')
            ->whereIn('class_id', $classIds)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true)
            ->pluck('user_id')
            ->toArray();
    }

    /**
     * Calculate dashboard statistics
     */
    private function calculateDashboardStats(int $teacherId, array $classIds, array $studentIds, array $filters = []): array
    {
        $totalStudents = count($studentIds);
        $totalClasses = count($classIds);

        // Today's attendance stats
        $today = today();
        $todayAttendance = Attendance::whereIn('user_id', $studentIds)
            ->where('date', $today)
            ->get();

        $presentCount = $todayAttendance->whereIn('status', ['Hadir', 'Terlambat'])->count();
        $attendanceRate = $totalStudents > 0 ? round(($presentCount / $totalStudents) * 100, 1) : 0;

        // Calculate trend (vs yesterday)
        $yesterday = today()->subDay();
        $yesterdayAttendance = Attendance::whereIn('user_id', $studentIds)
            ->where('date', $yesterday)
            ->get();
        
        $yesterdayPresent = $yesterdayAttendance->whereIn('status', ['Hadir', 'Terlambat'])->count();
        $yesterdayRate = $totalStudents > 0 ? round(($yesterdayPresent / $totalStudents) * 100, 1) : 0;
        $trend = round($attendanceRate - $yesterdayRate, 1);

        // Pending permissions count
        $pendingPermissions = Permission::where('status', 'pending')
            ->whereHas('student', fn($q) => $q->whereIn('id', $studentIds))
            ->count();

        // Active sessions count
        $activeSessions = AttendanceSession::active()
            ->where('generated_by', $teacherId)
            ->count();

        return [
            'total_students' => $totalStudents,
            'total_classes' => $totalClasses,
            'today_attendance_rate' => $attendanceRate,
            'today_attendance_trend' => $trend,
            'present_today' => $presentCount,
            'absent_today' => $totalStudents - $presentCount,
            'pending_permissions' => $pendingPermissions,
            'active_sessions' => $activeSessions,
        ];
    }

    /**
     * Get today's schedule for teacher
     */
    public function getTodaySchedule(int $teacherId): array
    {
        $day = strtolower(now()->locale('id')->dayName);

        return Schedule::where('teacher_id', $teacherId)
            ->where('day', $day)
            ->where('is_active', true)
            ->with(['class', 'subject'])
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) {
                $now = now();
                $startTime = Carbon::parse($schedule->start_time);
                $endTime = Carbon::parse($schedule->end_time);
                
                return [
                    'id' => $schedule->id,
                    'subject' => [
                        'id' => $schedule->subject->id,
                        'name' => $schedule->subject->name,
                        'code' => $schedule->subject->code,
                    ],
                    'class' => [
                        'id' => $schedule->class->id,
                        'name' => $schedule->class->name,
                    ],
                    'room' => $schedule->room ?? '-',
                    'start_time' => $schedule->start_time instanceof Carbon ? $schedule->start_time->format('H:i') : $schedule->start_time,
                    'end_time' => $schedule->end_time instanceof Carbon ? $schedule->end_time->format('H:i') : $schedule->end_time,
                    'time_slot' => $this->getTimeSlot($schedule->start_time instanceof Carbon ? $schedule->start_time->format('H:i') : $schedule->start_time),
                    'is_now' => $now->between($startTime, $endTime),
                    'is_upcoming' => $now->lessThan($startTime),
                ];
            })
            ->toArray();
    }

    /**
     * Determine time slot label
     */
    private function getTimeSlot(string $time): string
    {
        $hour = (int) explode(':', $time)[0];
        
        if ($hour >= 5 && $hour < 12) return 'pagi';
        if ($hour >= 12 && $hour < 15) return 'siang';
        return 'sore';
    }

    /**
     * Get quick actions for dashboard
     */
    private function getQuickActions(int $teacherId): array
    {
        $hasActiveSession = AttendanceSession::active()
            ->where('generated_by', $teacherId)
            ->exists();

        $pendingCount = Permission::where('status', 'pending')
            ->whereHas('student', fn($q) => $q->whereIn('id', $this->getTeacherStudentIds($teacherId)))
            ->count();

        return [
            [
                'id' => 'create_session',
                'label' => 'Buat Sesi Absensi',
                'icon' => 'Plus',
                'action' => '/dashboard/teacher/attendance/create',
                'color' => 'retro-orange',
                'enabled' => true,
            ],
            [
                'id' => 'view_permissions',
                'label' => 'Kelola Izin',
                'icon' => 'Bell',
                'action' => '/dashboard/teacher/permissions',
                'color' => 'warning',
                'enabled' => true,
                'badge' => $pendingCount > 0 ? $pendingCount : null,
            ],
            [
                'id' => 'export_report',
                'label' => 'Export Laporan',
                'icon' => 'Download',
                'action' => '/dashboard/teacher/export',
                'color' => 'retro-purple',
                'enabled' => true,
            ],
            [
                'id' => 'view_schedule',
                'label' => 'Lihat Jadwal',
                'icon' => 'Calendar',
                'action' => '/dashboard/teacher/schedule',
                'color' => 'retro-blue',
                'enabled' => true,
            ],
            [
                'id' => 'student_list',
                'label' => 'Daftar Siswa',
                'icon' => 'Users',
                'action' => '/dashboard/teacher/students',
                'color' => 'retro-lime',
                'enabled' => true,
            ],
        ];
    }

    /**
     * Get period start date based on period type
     */
    private function getPeriodStart(string $period): string
    {
        return match ($period) {
            'daily' => today()->toDateString(),
            'weekly' => now()->startOfWeek()->toDateString(),
            'monthly' => now()->startOfMonth()->toDateString(),
            'yearly' => now()->startOfYear()->toDateString(),
            default => now()->subMonth()->toDateString(),
        };
    }

    /**
     * Format attendance data for chart
     */
    private function formatAttendanceChart($attendanceData, string $startDate, string $endDate): array
    {
        $period = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $chart = [];

        while ($period->lte($end)) {
            $date = $period->toDateString();
            $dayData = $attendanceData->get($date) ?? collect();
            
            $chart[] = [
                'date' => $date,
                'label' => $period->locale('id')->isoFormat('ddd, D MMM'),
                'present' => $dayData->get('Hadir')?->first()?->count ?? 0,
                'late' => $dayData->get('Terlambat')?->first()?->count ?? 0,
                'absent' => $dayData->get('Alpha')?->first()?->count ?? 0,
                'permission' => $dayData->get('Izin')?->first()?->count ?? 0,
                'sick' => $dayData->get('Sakit')?->first()?->count ?? 0,
            ];
            
            $period->addDay();
        }

        return $chart;
    }

    /**
     * Format permission data for chart
     */
    private function formatPermissionChart($permissionData): array
    {
        return [
            'approved' => $permissionData->get('approved')?->groupBy('type')->map(fn($items) => $items->sum('count')) ?? [],
            'rejected' => $permissionData->get('rejected')?->groupBy('type')->map(fn($items) => $items->sum('count')) ?? [],
            'pending' => $permissionData->get('pending')?->groupBy('type')->map(fn($items) => $items->sum('count')) ?? [],
        ];
    }

    /**
     * Calculate approval rate from permission data
     */
    private function calculateApprovalRate($permissionData): float
    {
        $approved = $permissionData->get('approved')?->sum('count') ?? 0;
        $rejected = $permissionData->get('rejected')?->sum('count') ?? 0;
        $total = $approved + $rejected;
        
        return $total > 0 ? round(($approved / $total) * 100, 1) : 0;
    }

    /**
     * Export attendance data
     */
    private function exportAttendanceData(array $studentIds, string $startDate, string $endDate): array
    {
        return Attendance::whereIn('user_id', $studentIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->with(['user' => fn($q) => $q->select('id', 'name', 'email')])
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn($a) => [
                'date' => $a->date,
                'student_name' => $a->user?->name,
                'student_email' => $a->user?->email,
                'status' => $a->status,
                'check_in_time' => $a->check_in_time,
                'check_out_time' => $a->check_out_time,
                'location' => $a->location_string,
            ])
            ->toArray();
    }

    /**
     * Export permission data
     */
    private function exportPermissionData(array $studentIds, string $startDate, string $endDate): array
    {
        return Permission::whereHas('student', fn($q) => $q->whereIn('id', $studentIds))
            ->whereBetween('date_from', [$startDate, $endDate])
            ->with(['student.user' => fn($q) => $q->select('id', 'name', 'email')])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'student_name' => $p->student->user?->name,
                'student_email' => $p->student->user?->email,
                'type' => $p->type,
                'date_from' => $p->date_from,
                'date_to' => $p->date_to,
                'reason' => $p->reason,
                'status' => $p->status,
                'approved_by' => $p->approvedBy?->name,
                'approved_at' => $p->approved_at,
                'created_at' => $p->created_at,
            ])
            ->toArray();
    }

    /**
     * Export student data
     */
    private function exportStudentData(array $studentIds): array
    {
        return User::whereIn('id', $studentIds)
            ->with(['profile' => fn($q) => $q->select('user_id', 'nis', 'class_level')])
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'nis' => $u->profile?->nis,
                'class_level' => $u->profile?->class_level,
                'avatar_url' => $u->avatar_url,
            ])
            ->toArray();
    }

    /**
     * Format export data based on format type
     */
    private function formatExport(array $data, string $format): string
    {
        return match ($format) {
            'csv' => $this->arrayToCsv($data),
            'xlsx' => $this->arrayToXlsx($data), // Would need phpoffice/phpspreadsheet
            'json' => json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            default => json_encode($data),
        };
    }

    /**
     * Convert array to CSV format
     */
    private function arrayToCsv(array $data, string $delimiter = ';'): string
    {
        if (empty($data)) return '';
        
        // Handle nested arrays
        $flatData = $this->flattenArray($data);
        
        $output = fopen('php://memory', 'w');
        
        // Add BOM for UTF-8 Excel compatibility
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Write headers
        if (!empty($flatData)) {
            fputcsv($output, array_keys($flatData[0]), $delimiter);
            
            // Write rows
            foreach ($flatData as $row) {
                fputcsv($output, $row, $delimiter);
            }
        }
        
        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);
        
        return $content;
    }

    /**
     * Flatten nested array for CSV export
     */
    private function flattenArray(array $data): array
    {
        if (empty($data)) return [];
        
        $result = [];
        $headers = [];
        
        // Collect all possible keys
        foreach ($data as $item) {
            $this->collectKeys($item, $headers);
        }
        
        // Build flat rows
        foreach ($data as $item) {
            $row = [];
            foreach ($headers as $key) {
                $row[$key] = $this->getNestedValue($item, $key) ?? '';
            }
            $result[] = $row;
        }
        
        return $result;
    }

    /**
     * Collect all keys from nested array
     */
    private function collectKeys(array $item, array &$headers, string $prefix = ''): void
    {
        foreach ($item as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;
            
            if (is_array($value) && !empty($value) && !is_numeric(array_key_first($value))) {
                $this->collectKeys($value, $headers, $fullKey);
            } else {
                if (!in_array($fullKey, $headers)) {
                    $headers[] = $fullKey;
                }
            }
        }
    }

    /**
     * Get value from nested array using dot notation
     */
    private function getNestedValue(array $item, string $key)
    {
        $keys = explode('.', $key);
        $value = $item;
        
        foreach ($keys as $k) {
            if (is_array($value) && array_key_exists($k, $value)) {
                $value = $value[$k];
            } else {
                return null;
            }
        }
        
        return is_array($value) ? json_encode($value) : $value;
    }

    /**
     * Get content type for export format
     */
    private function getContentType(string $format): string
    {
        return match ($format) {
            'csv' => 'text/csv; charset=UTF-8',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'json' => 'application/json',
            'pdf' => 'application/pdf',
            default => 'application/octet-stream',
        };
    }

    /**
     * Placeholder for XLSX export (requires phpoffice/phpspreadsheet)
     */
    private function arrayToXlsx(array $data): string
    {
        // Would require: composer require phpoffice/phpspreadsheet
        // Return JSON as fallback
        return json_encode($data);
    }
}