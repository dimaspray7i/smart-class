<?php
/**
 * PATCH FILE: Fix AttendanceService::createSession() Method
 *
 * This patch fixes the field mapping issue where frontend sends start_time/end_time
 * but service expects duration_minutes.
 *
 * Issues Fixed:
 * 1. Convert start_time and end_time to duration_minutes
 * 2. Add teacher class access verification
 * 3. Add subject-class relationship validation
 * 4. Generate actual QR code image
 * 5. Support manual session creation
 *
 * Location: backend/app/Services/AttendanceService.php (replace lines 792-841)
 */

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Carbon\Carbon;

public function createSession(int $teacherId, array $data): array {
    try {
        // ═══════════════════════════════════════════════════════
        // CALCULATE DURATION FROM TIME WINDOW
        // ═══════════════════════════════════════════════════════
        if (isset($data['start_time']) && isset($data['end_time'])) {
            try {
                $start = Carbon::createFromFormat('H:i', $data['start_time']);
                $end = Carbon::createFromFormat('H:i', $data['end_time']);

                // Calculate minutes difference
                $data['duration_minutes'] = max(1, $end->diffInMinutes($start));
            } catch (\Exception $e) {
                return [
                    'success' => false,
                    'message' => 'Format waktu tidak valid. Gunakan format HH:ii',
                    'code' => 'INVALID_TIME_FORMAT',
                ];
            }
        }

        $duration = $data['duration_minutes'] ?? config('app.attendance_code_duration_minutes', 10);
        $isManual = $data['is_manual'] ?? false;

        // ═══════════════════════════════════════════════════════
        // VERIFY TEACHER HAS ACCESS TO CLASS
        // ═══════════════════════════════════════════════════════
        $hasAccess = false;

        // Check if teacher teaches in this class (via schedule)
        $hasSchedule = \App\Models\Schedule::where('teacher_id', $teacherId)
            ->where('class_id', $data['class_id'])
            ->exists();

        // OR check if teacher is class mentor (wali kelas)
        $isWaliKelas = \App\Models\ClassUser::where('user_id', $teacherId)
            ->where('class_id', $data['class_id'])
            ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
            ->where('is_active', true)
            ->exists();

        $hasAccess = $hasSchedule || $isWaliKelas;

        if (!$hasAccess) {
            return [
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk membuat sesi di kelas ini.',
                'code' => 'FORBIDDEN',
            ];
        }

        // ═══════════════════════════════════════════════════════
        // VERIFY SUBJECT-CLASS RELATIONSHIP (if not manual)
        // ═══════════════════════════════════════════════════════
        if (!$isManual && isset($data['subject_id'])) {
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
        } elseif (isset($data['subject_id'])) {
            // For manual sessions, still validate subject exists
            $subjectExists = \App\Models\Subject::find($data['subject_id']);
            if (!$subjectExists) {
                return [
                    'success' => false,
                    'message' => 'Mata pelajaran tidak ditemukan.',
                    'code' => 'INVALID_SUBJECT',
                ];
            }
        }

        // ═══════════════════════════════════════════════════════
        // GENERATE UNIQUE CODE
        // ═══════════════════════════════════════════════════════
        $code = strtoupper(\Illuminate\Support\Str::random(6));

        // Ensure uniqueness
        while (\App\Models\AttendanceSession::where('code', $code)->exists()) {
            $code = strtoupper(\Illuminate\Support\Str::random(6));
        }

        // ═══════════════════════════════════════════════════════
        // GENERATE QR CODE IMAGE
        // ═══════════════════════════════════════════════════════
        $qrBase64 = null;
        try {
            $qrImage = QrCode::format('png')->size(300)->generate($code);
            $qrBase64 = 'data:image/png;base64,' . base64_encode($qrImage);
        } catch (\Exception $e) {
            // QR generation failed, continue without it
            \Illuminate\Support\Facades\Log::warning('QR code generation failed', [
                'error' => $e->getMessage(),
            ]);
        }

        // ═══════════════════════════════════════════════════════
        // CREATE SESSION
        // ═══════════════════════════════════════════════════════
        $session = \App\Models\AttendanceSession::create([
            'code' => $code,
            'class_id' => $data['class_id'],
            'subject_id' => $data['subject_id'] ?? null,
            'schedule_id' => $data['schedule_id'] ?? null,
            'generated_by' => $teacherId,
            'valid_from' => now(),
            'valid_until' => now()->addMinutes($duration),
            'is_active' => true,
            'is_manual' => $isManual,
            'qr_code' => $qrBase64,
            'max_uses' => $data['max_uses'] ?? null,
            'used_count' => 0,
            'radius_meters' => $data['radius_meters'] ?? config('app.attendance_radius_meters', 100),
            'center_lat' => $data['center_lat'] ?? config('app.school_latitude', -6.200000),
            'center_lng' => $data['center_lng'] ?? config('app.school_longitude', 106.816666),
            'pkl_location_id' => $data['pkl_location_id'] ?? null,
        ]);

        // ═══════════════════════════════════════════════════════
        // RETURN SUCCESS RESPONSE
        // ═══════════════════════════════════════════════════════
        return [
            'success' => true,
            'message' => 'Sesi absensi berhasil dibuat.',
            'code' => 'SESSION_CREATED',
            'data' => [
                'session_id' => $session->id,
                'code' => $code,
                'qr_code' => $qrBase64,
                'valid_until' => $session->valid_until->format('H:i:s'),
                'duration_minutes' => $duration,
                'radius_meters' => $session->radius_meters,
                'center_location' => $session->center_location,
                'max_uses' => $session->max_uses,
                'is_manual' => $isManual,
                'session_type' => $isManual ? 'manual' : 'scheduled',
            ],
        ];

    } catch (\Illuminate\Database\QueryException $e) {
        \Illuminate\Support\Facades\Log::error('AttendanceService::createSession database error', [
            'teacher_id' => $teacherId,
            'error' => $e->getMessage(),
        ]);

        return [
            'success' => false,
            'message' => 'Gagal menyimpan sesi absensi ke database.',
            'code' => 'DATABASE_ERROR',
        ];

    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('AttendanceService::createSession failed', [
            'teacher_id' => $teacherId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return [
            'success' => false,
            'message' => 'Gagal membuat sesi absensi.',
            'code' => 'SERVER_ERROR',
        ];
    }
}
