<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\User;
use App\Helpers\GeoHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class AttendanceService
{
    /**
     * Submit attendance for student
     * 
     * @param User $user
     * @param array $data ['lat', 'lng', 'code', 'photo_url', 'device']
     * @return array ['success' => bool, 'message' => string, 'data' => ?Attendance, 'code' => string]
     */
    public function submitAttendance(User $user, array $data): array
    {
        try {
            DB::beginTransaction();

            $today = Carbon::today()->toDateString();
            $now = now();

            // 1. Validate: Already attended today?
            $existing = Attendance::where('user_id', $user->id)
                ->where('date', $today)
                ->first();

            if ($existing) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Anda sudah absen hari ini.',
                    'code' => 'ALREADY_ATTENDED',
                    'data' => $existing,
                ];
            }

            // 2. Validate: Attendance session & code
            $session = AttendanceSession::validCode($data['code'])->first();

            if (!$session) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => 'Kode absensi tidak valid atau sudah kadaluarsa.',
                    'code' => 'INVALID_CODE',
                ];
            }

            // 3. Validate: Location radius
            $distance = GeoHelper::calculateDistance(
                $data['lat'],
                $data['lng'],
                $session->center_lat ?? config('app.school_latitude', -6.200000),
                $session->center_lng ?? config('app.school_longitude', 106.816666)
            );

            $maxRadius = $session->radius_meters ?? config('app.attendance_radius_meters', 100);

            if ($distance > $maxRadius) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => sprintf(
                        'Lokasi terlalu jauh (%.0f m). Maksimal %d m dari titik absensi.',
                        $distance,
                        $maxRadius
                    ),
                    'code' => 'OUT_OF_RADIUS',
                    'debug' => config('app.debug') ? [
                        'distance' => round($distance),
                        'max_radius' => $maxRadius,
                        'your_location' => ['lat' => $data['lat'], 'lng' => $data['lng']],
                    ] : null,
                ];
            }

            // 4. Validate: Time window
            $openTime = config('app.attendance_open_time', '06:00');
            $closeTime = config('app.attendance_close_time', '16:00');
            $currentTime = $now->format('H:i');

            if ($currentTime < $openTime || $currentTime > $closeTime) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => "Absensi hanya tersedia pukul {$openTime} - {$closeTime}.",
                    'code' => 'OUT_OF_TIME_WINDOW',
                ];
            }

            // 5. Determine status (Hadir/Terlambat)
            $scheduledStartTime = $this->getClassStartTime($user, $session->class_id);
            $status = $scheduledStartTime && $now->gt($scheduledStartTime)
                ? 'Terlambat'
                : 'Hadir';

            // 6. Create attendance record
            $attendance = Attendance::create([
                'user_id' => $user->id,
                'date' => $today,
                'lat' => $data['lat'],
                'lng' => $data['lng'],
                'status' => $status,
                'photo_url' => $data['photo_url'] ?? null,
                'code_used' => strtoupper($data['code']),
                'device_info' => $data['device'] ?? 'web',
                'verification_method' => 'auto',
            ]);

            // 7. Increment session usage counter
            $session->incrementUsage();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Absensi berhasil dicatat.',
                'code' => 'ATTENDANCE_SUCCESS',
                'data' => $attendance->load('user:id,name,avatar_url'),
                'meta' => [
                    'status' => $status,
                    'distance_from_school' => round($distance) . ' m',
                    'session_remaining' => $session->remaining_time,
                    'check_in_time' => $now->format('H:i:s'),
                ],
            ];

        } catch (Exception $e) {
            DB::rollBack();

            Log::error('AttendanceService::submitAttendance failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memproses absensi. Silakan coba lagi.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ];
        }
    }

    /**
     * Get attendance history with filters
     */
    public function getHistory(int $userId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Attendance::where('user_id', $userId)->orderBy('date', 'desc');

        if (!empty($filters['month']) && is_numeric($filters['month'])) {
            $query->whereMonth('date', (int) $filters['month']);
        }
        if (!empty($filters['year']) && is_numeric($filters['year'])) {
            $query->whereYear('date', (int) $filters['year']);
        }
        if (!empty($filters['status']) && in_array($filters['status'], ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['start_date'])) {
            $query->whereDate('date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('date', '<=', $filters['end_date']);
        }

        // Retention policy
        $retentionDays = config('app.analytics_retention_days', 90);
        $query->where('date', '>=', Carbon::today()->subDays($retentionDays));

        return $query->paginate(15);
    }

    /**
     * Calculate attendance statistics
     */
    public function getStats(int $userId): array
    {
        $retentionDays = config('app.analytics_retention_days', 90);
        $since = Carbon::today()->subDays($retentionDays);

        $total = Attendance::where('user_id', $userId)->where('date', '>=', $since)->count();
        $hadir = Attendance::where('user_id', $userId)->where('status', 'Hadir')->where('date', '>=', $since)->count();
        $terlambat = Attendance::where('user_id', $userId)->where('status', 'Terlambat')->where('date', '>=', $since)->count();
        $izin = Attendance::where('user_id', $userId)->where('status', 'Izin')->where('date', '>=', $since)->count();
        $sakit = Attendance::where('user_id', $userId)->where('status', 'Sakit')->where('date', '>=', $since)->count();
        $alpha = Attendance::where('user_id', $userId)->where('status', 'Alpha')->where('date', '>=', $since)->count();

        return [
            'period' => [
                'from' => $since->toDateString(),
                'to' => Carbon::today()->toDateString(),
                'days' => $retentionDays,
            ],
            'summary' => [
                'total' => $total,
                'hadir' => $hadir,
                'terlambat' => $terlambat,
                'izin' => $izin,
                'sakit' => $sakit,
                'alpha' => $alpha,
            ],
            'percentage' => [
                'hadir' => $total > 0 ? round(($hadir / $total) * 100, 2) : 0,
                'on_time' => $total > 0 ? round((($hadir + $terlambat) / $total) * 100, 2) : 0,
            ],
            'streak' => $this->calculateCurrentStreak($userId),
            'last_attendance' => Attendance::where('user_id', $userId)
                ->latest('date')
                ->first(['date', 'status', 'created_at'])
                ?->toArray(),
        ];
    }

    /**
     * Get today's attendance status for user
     */
    public function getTodayStatus(int $userId): array
    {
        $today = today()->toDateString();
        $attendance = Attendance::where('user_id', $userId)
            ->where('date', $today)
            ->first();

        $openTime = config('app.attendance_open_time', '06:00');
        $closeTime = config('app.attendance_close_time', '16:00');
        $currentTime = now()->format('H:i');

        return [
            'date' => $today,
            'has_attended' => $attendance !== null,
            'attendance' => $attendance,
            'can_attend' => !$attendance && $currentTime >= $openTime && $currentTime <= $closeTime,
            'time_window' => [
                'open' => $openTime,
                'close' => $closeTime,
                'current' => $currentTime,
            ],
        ];
    }

    /**
     * Create attendance session for teacher
     */
    public function createSession(int $teacherId, array $data): array
    {
        try {
            $code = strtoupper(\Illuminate\Support\Str::random(6));
            $duration = $data['duration_minutes'] ?? config('app.attendance_code_duration_minutes', 10);

            $session = AttendanceSession::create([
                'code' => $code,
                'class_id' => $data['class_id'],
                'generated_by' => $teacherId,
                'valid_from' => now(),
                'valid_until' => now()->addMinutes($duration),
                'is_active' => true,
                'max_uses' => $data['max_uses'] ?? null,
                'used_count' => 0,
                'radius_meters' => $data['radius_meters'] ?? config('app.attendance_radius_meters', 100),
                'center_lat' => $data['center_lat'] ?? config('app.school_latitude', -6.200000),
                'center_lng' => $data['center_lng'] ?? config('app.school_longitude', 106.816666),
            ]);

            return [
                'success' => true,
                'message' => 'Sesi absensi berhasil dibuat.',
                'code' => 'SESSION_CREATED',
                'data' => [
                    'code' => $code,
                    'valid_until' => $session->valid_until->format('H:i:s'),
                    'duration_minutes' => $duration,
                    'radius_meters' => $session->radius_meters,
                    'center_location' => $session->center_location,
                    'max_uses' => $session->max_uses,
                ],
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::createSession failed', [
                'teacher_id' => $teacherId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat sesi absensi.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Generate new code for existing session
     */
    public function generateCode(int $sessionId, int $teacherId): array
    {
        try {
            $session = AttendanceSession::find($sessionId);

            if (!$session) {
                return [
                    'success' => false,
                    'message' => 'Sesi tidak ditemukan.',
                    'code' => 'SESSION_NOT_FOUND',
                ];
            }

            // Verify teacher owns this session
            if ($session->generated_by !== $teacherId) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses ke sesi ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            $newCode = strtoupper(\Illuminate\Support\Str::random(6));
            $session->update(['code' => $newCode]);

            return [
                'success' => true,
                'message' => 'Kode baru berhasil digenerate.',
                'code' => 'CODE_GENERATED',
                'data' => ['code' => $newCode],
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::generateCode failed', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal generate kode.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Close attendance session
     */
    public function closeSession(int $sessionId, int $teacherId): array
    {
        try {
            $session = AttendanceSession::find($sessionId);

            if (!$session) {
                return [
                    'success' => false,
                    'message' => 'Sesi tidak ditemukan.',
                    'code' => 'SESSION_NOT_FOUND',
                ];
            }

            if ($session->generated_by !== $teacherId) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses ke sesi ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            $session->close();

            return [
                'success' => true,
                'message' => 'Sesi absensi ditutup.',
                'code' => 'SESSION_CLOSED',
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::closeSession failed', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menutup sesi.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Monitor attendance session (get real-time stats)
     */
    public function monitorSession(int $sessionId): array
    {
        $session = AttendanceSession::with(['class', 'teacher'])->find($sessionId);

        if (!$session) {
            return [
                'success' => false,
                'message' => 'Sesi tidak ditemukan.',
                'code' => 'SESSION_NOT_FOUND',
            ];
        }

        $attendances = Attendance::where('code_used', $session->code)
            ->with('user:id,name,avatar_url')
            ->get();

        return [
            'success' => true,
            'data' => [
                'session' => $session,
                'total_students' => $session->class->students()->count(),
                'attended_count' => $attendances->count(),
                'remaining_uses' => $session->remaining_uses,
                'is_valid' => $session->is_valid,
                'remaining_time' => $session->remaining_time,
                'attendances' => $attendances,
            ],
        ];
    }

    /**
     * Get teacher's attendance history
     */
    public function getTeacherHistory(int $teacherId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        // Get all students taught by this teacher
        $studentIds = DB::table('class_user')
            ->where('teacher_id', $teacherId)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true)
            ->when(!empty($filters['class_id']), function ($q) use ($filters) {
                return $q->where('class_id', $filters['class_id']);
            })
            ->pluck('user_id');

        $query = Attendance::whereIn('user_id', $studentIds)
            ->with('user:id,name,avatar_url')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc');

        if (!empty($filters['start_date'])) {
            $query->whereDate('date', '>=', $filters['start_date']);
        }
        if (!empty($filters['end_date'])) {
            $query->whereDate('date', '<=', $filters['end_date']);
        }
        if (!empty($filters['status']) && in_array($filters['status'], ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate(20);
    }

    /**
     * Manual verify attendance (by teacher)
     */
    public function manualVerify(int $teacherId, int $attendanceId, string $status): array
    {
        try {
            $attendance = Attendance::find($attendanceId);

            if (!$attendance) {
                return [
                    'success' => false,
                    'message' => 'Data absensi tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            // Verify teacher has access to this student
            $isAuthorized = DB::table('class_user')
                ->where('teacher_id', $teacherId)
                ->where('user_id', $attendance->user_id)
                ->where('is_active', true)
                ->exists();

            if (!$isAuthorized) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk memverifikasi siswa ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            $validStatuses = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'];
            if (!in_array($status, $validStatuses)) {
                return [
                    'success' => false,
                    'message' => 'Status tidak valid.',
                    'code' => 'INVALID_STATUS',
                ];
            }

            $attendance->update([
                'status' => $status,
                'verification_method' => 'manual',
                'notes' => "Diverifikasi manual oleh guru ID {$teacherId} pada " . now()->format('Y-m-d H:i'),
            ]);

            return [
                'success' => true,
                'message' => "Status absensi diubah menjadi {$status}.",
                'code' => 'VERIFIED',
                'data' => $attendance->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::manualVerify failed', [
                'teacher_id' => $teacherId,
                'attendance_id' => $attendanceId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memverifikasi absensi.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    // ═══════════════════════════════════════════════════════════
    // PRIVATE HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get class start time for today
     */
    private function getClassStartTime(User $user, int $classId): ?Carbon
    {
        $day = now()->locale('id')->dayName;

        $schedule = \App\Models\Schedule::where('class_id', $classId)
            ->where('day', strtolower($day))
            ->where('start_time', '>=', now()->format('H:i'))
            ->orderBy('start_time')
            ->first();

        if (!$schedule) {
            return null;
        }

        return Carbon::parse($schedule->start_time);
    }

    /**
     * Calculate current attendance streak
     */
    private function calculateCurrentStreak(int $userId): int
    {
        $today = Carbon::today();
        $streak = 0;

        for ($i = 0; $i < 30; $i++) {
            $date = $today->copy()->subDays($i)->toDateString();
            $attendance = Attendance::where('user_id', $userId)
                ->where('date', $date)
                ->where('status', 'Hadir')
                ->exists();

            if ($attendance) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Get classes taught by teacher
     */
    public function getAssignedClasses(int $teacherId): array
    {
        $classes = DB::table('class_user')
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->join('classes', 'class_user.class_id', '=', 'classes.id')
            ->select('classes.*', 'class_user.role_in_class', 'class_user.academic_year')
            ->get();

        return $classes->toArray();
    }

    /**
     * Get students by class
     */
    public function getClassStudents(int $classId): array
    {
        $students = DB::table('class_user')
            ->where('class_id', $classId)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true)
            ->join('users', 'class_user.user_id', '=', 'users.id')
            ->select('users.id', 'users.name', 'users.email', 'users.avatar_url')
            ->get();

        return $students->toArray();
    }
}