<?php
/**
 * PHASE 2 PATCH 1: Fix AttendanceService::createSession()
 *
 * Fixes:
 * 1. Duration calculation from start_time/end_time
 * 2. Date handling (use provided date instead of now())
 * 3. Teacher authorization check
 * 4. Subject-class relationship validation
 *
 * File: backend/app/Services/AttendanceService.php
 *
 * ACTION:
 * Find the createSession() method around line 792
 * Replace the ENTIRE method with the code below
 *
 * ====================================
 */

use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

public function createSession(int $teacherId, array $data): array
{
    try {
        // ═══════════════════════════════════════════════════════
        // STEP 1: CALCULATE DURATION FROM TIME WINDOW
        // ═══════════════════════════════════════════════════════
        if (isset($data['start_time']) && isset($data['end_time'])) {
            try {
                // Parse time strings (format: HH:i)
                $start = Carbon::createFromFormat('H:i', $data['start_time']);
                $end = Carbon::createFromFormat('H:i', $data['end_time']);

                // Calculate minutes between times
                $durationMinutes = $end->diffInMinutes($start);

                if ($durationMinutes <= 0) {
                    return [
                        'success' => false,
                        'message' => 'Waktu akhir harus setelah waktu mulai.',
                        'code' => 'INVALID_TIME_RANGE',
                    ];
                }

                $data['duration_minutes'] = $durationMinutes;

            } catch (\Exception $e) {
                Log::warning('Failed to parse time format', ['error' => $e->getMessage()]);
                // Fall back to config if parsing fails
                $data['duration_minutes'] = config('app.attendance_code_duration_minutes', 10);
            }
        } else {
            // No time window provided, use config default
            $data['duration_minutes'] = $data['duration_minutes'] ?? config('app.attendance_code_duration_minutes', 10);
        }

        $duration = $data['duration_minutes'];

        // ═══════════════════════════════════════════════════════
        // STEP 2: VERIFY TEACHER HAS ACCESS TO CLASS
        // ═══════════════════════════════════════════════════════
        $hasAccess = false;

        // Check if teacher teaches in this class (via schedule)
        $hasSchedule = \App\Models\Schedule::where('teacher_id', $teacherId)
            ->where('class_id', $data['class_id'])
            ->exists();

        // OR check if teacher is class mentor (wali_kelas)
        $isWaliKelas = \App\Models\ClassUser::where('user_id', $teacherId)
            ->where('class_id', $data['class_id'])
            ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
            ->where('is_active', true)
            ->exists();

        $hasAccess = $hasSchedule || $isWaliKelas;

        if (!$hasAccess) {
            Log::warning('Teacher access denied', [
                'teacher_id' => $teacherId,
                'class_id' => $data['class_id'],
                'reason' => 'Not in schedule and not wali_kelas',
            ]);

            return [
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk membuat sesi absensi di kelas ini.',
                'code' => 'FORBIDDEN',
            ];
        }

        // ═══════════════════════════════════════════════════════
        // STEP 3: VERIFY SUBJECT-CLASS RELATIONSHIP
        // ═══════════════════════════════════════════════════════
        $isManual = $data['is_manual'] ?? false;

        if (isset($data['subject_id'])) {
            if (!$isManual) {
                // For scheduled sessions, subject must be in class schedule
                $subjectInClass = \App\Models\Schedule::where('class_id', $data['class_id'])
                    ->where('subject_id', $data['subject_id'])
                    ->exists();

                if (!$subjectInClass) {
                    return [
                        'success' => false,
                        'message' => 'Mata pelajaran tidak diajarkan di kelas ini.',
                        'code' => 'INVALID_SUBJECT_FOR_CLASS',
                    ];
                }
            } else {
                // For manual sessions, just verify subject exists
                $subjectExists = \App\Models\Subject::find($data['subject_id']);
                if (!$subjectExists) {
                    return [
                        'success' => false,
                        'message' => 'Mata pelajaran tidak ditemukan.',
                        'code' => 'INVALID_SUBJECT',
                    ];
                }
            }
        }

        // ═══════════════════════════════════════════════════════
        // STEP 4: PARSE DATE AND TIME PROPERLY
        // ═══════════════════════════════════════════════════════
        $sessionDate = now()->toDateString(); // Default to today
        $validFrom = now();
        $validUntil = now()->addMinutes($duration);

        if (isset($data['date'])) {
            try {
                $sessionDate = Carbon::createFromFormat('Y-m-d', $data['date'])->toDateString();

                // For scheduled/future sessions
                if (!$isManual && isset($data['start_time'])) {
                    // Create datetime for session start
                    $validFrom = Carbon::createFromFormat(
                        'Y-m-d H:i',
                        $sessionDate . ' ' . $data['start_time']
                    );

                    $validUntil = $validFrom->copy()->addMinutes($duration);
                }
            } catch (\Exception $e) {
                Log::warning('Failed to parse date', ['error' => $e->getMessage()]);
                // Fall back to now()
            }
        }

        // ═══════════════════════════════════════════════════════
        // STEP 5: GENERATE UNIQUE CODE
        // ═══════════════════════════════════════════════════════
        $code = strtoupper(\Illuminate\Support\Str::random(6));

        // Ensure uniqueness
        $attempts = 0;
        while (\App\Models\AttendanceSession::where('code', $code)->exists() && $attempts < 5) {
            $code = strtoupper(\Illuminate\Support\Str::random(6));
            $attempts++;
        }

        if ($attempts >= 5) {
            return [
                'success' => false,
                'message' => 'Gagal membuat kode unik untuk sesi.',
                'code' => 'CODE_GENERATION_FAILED',
            ];
        }

        // ═══════════════════════════════════════════════════════
        // STEP 6: CREATE SESSION IN DATABASE
        // ═══════════════════════════════════════════════════════
        $session = \App\Models\AttendanceSession::create([
            'code' => $code,
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'] ?? null,
            'schedule_id' => $data['schedule_id'] ?? null,
            'generated_by' => $teacherId,
            'valid_from' => $validFrom,
            'valid_until' => $validUntil,
            'is_active' => true,
            'is_manual' => $isManual,
            'max_uses' => $data['max_uses'] ?? null,
            'used_count' => 0,
            'radius_meters' => $data['radius_meters'] ?? config('app.attendance_radius_meters', 100),
            'center_lat' => $data['center_lat'] ?? config('app.school_latitude', -6.200000),
            'center_lng' => $data['center_lng'] ?? config('app.school_longitude', 106.816666),
            'pkl_location_id' => $data['pkl_location_id'] ?? null,
        ]);

        // ═══════════════════════════════════════════════════════
        // STEP 7: RETURN SUCCESS RESPONSE
        // ═══════════════════════════════════════════════════════
        Log::info('Attendance session created successfully', [
            'session_id' => $session->id,
            'teacher_id' => $teacherId,
            'class_id' => $data['class_id'],
            'duration' => $duration,
            'is_manual' => $isManual,
        ]);

        return [
            'success' => true,
            'message' => 'Sesi absensi berhasil dibuat.',
            'code' => 'SESSION_CREATED',
            'data' => [
                'session_id' => $session->id,
                'code' => $code,
                'valid_from' => $validFrom->format('H:i:s'),
                'valid_until' => $validUntil->format('H:i:s'),
                'duration_minutes' => $duration,
                'radius_meters' => $session->radius_meters,
                'center_location' => $session->center_location,
                'max_uses' => $session->max_uses,
                'is_manual' => $isManual,
                'session_type' => $isManual ? 'manual' : 'scheduled',
            ],
        ];

    } catch (\Illuminate\Database\QueryException $e) {
        Log::error('AttendanceService::createSession database error', [
            'teacher_id' => $teacherId,
            'error' => $e->getMessage(),
        ]);

        return [
            'success' => false,
            'message' => 'Gagal menyimpan sesi absensi ke database.',
            'code' => 'DATABASE_ERROR',
        ];

    } catch (\Exception $e) {
        Log::error('AttendanceService::createSession failed', [
            'teacher_id' => $teacherId,
            'error' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null,
        ]);

        return [
            'success' => false,
            'message' => 'Gagal membuat sesi absensi.',
            'code' => 'SERVER_ERROR',
            'debug' => config('app.debug') ? $e->getMessage() : null,
        ];
    }
}

// ====================================
// END OF PATCH 1
// ====================================
