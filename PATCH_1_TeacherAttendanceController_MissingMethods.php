<?php
/**
 * PATCH FILE: Add Missing Methods to Teacher/AttendanceController.php
 *
 * This patch adds 8 missing methods that are defined in routes but not implemented in the controller.
 *
 * Simply append this code to the end of the TeacherAttendanceController class (before the final })
 *
 * Location: backend/app/Http/Controllers/Teacher/AttendanceController.php
 */

    // ═══════════════════════════════════════════════════════════
    // MISSING METHODS - RETRO VARIANTS & UTILITIES
    // These methods were called in routes but not implemented
    // ═══════════════════════════════════════════════════════════

    /**
     * Retro-themed session creation (delegates to existing createSession)
     */
    public function retroCreateSession(Request $request): JsonResponse
    {
        return $this->createSession($request);
    }

    /**
     * Generate retro QR code (delegates to generateCode)
     */
    public function generateRetroQR(Request $request, int $id): JsonResponse
    {
        return $this->generateCode($request, $id);
    }

    /**
     * Retro-themed session monitoring (delegates to monitor)
     */
    public function retroMonitor(int $id, Request $request): JsonResponse
    {
        return $this->monitor($id, $request);
    }

    /**
     * Retro-themed manual verification (delegates to manualVerify)
     */
    public function retroManualVerify(Request $request, int $id): JsonResponse
    {
        return $this->manualVerify($request, $id);
    }

    /**
     * Grid view of students (delegates to students)
     */
    public function studentsGrid(Request $request): JsonResponse
    {
        return $this->students($request);
    }

    /**
     * Retro student profile view (delegates to studentAttendance)
     */
    public function retroStudentProfile(int $id, Request $request): JsonResponse
    {
        return $this->studentAttendance($id, $request);
    }

    /**
     * Live real-time statistics for session
     */
    public function liveStats(int $id, Request $request): JsonResponse
    {
        try {
            $teacherId = $request->user()->id;

            $result = $this->attendanceService->monitorSession($id, $teacherId, [
                'stats_only' => true,
            ]);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => 'STATS_FAILED',
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Statistik sesi berhasil diambil.',
                'code' => 'STATS_SUCCESS',
                'data' => $result['data'],
            ], 200);

        } catch (\Exception $e) {
            Log::error('AttendanceController::liveStats failed', [
                'teacher_id' => $request->user()?->id,
                'session_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil statistik sesi.',
                'code' => 'STATS_ERROR',
            ], 500);
        }
    }

    /**
     * Export specific student's attendance
     */
    public function exportStudentAttendance(int $id, Request $request)
    {
        try {
            $teacherId = $request->user()->id;

            $validated = $request->validate([
                'format' => 'required|in:csv,xlsx',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
            ]);

            $result = $this->attendanceExportService->exportAttendance($teacherId, [
                'student_id' => $id,
                'format' => $validated['format'],
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ]);

            if (!$result['success']) {
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => 'EXPORT_FAILED',
                ], 400);
            }

            return response()->streamDownload(function () use ($result) {
                echo $result['file_content'];
            }, $result['filename'], [
                'Content-Type' => $result['content_type'],
                'Content-Disposition' => "attachment; filename=\"{$result['filename']}\"",
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi parameter export gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('AttendanceController::exportStudentAttendance failed', [
                'teacher_id' => $request->user()?->id,
                'student_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal export data absensi siswa.',
                'code' => 'EXPORT_ERROR',
            ], 500);
        }
    }

    /**
     * Retro-themed analytics (delegates to analytics)
     */
    public function retroAnalytics(Request $request): JsonResponse
    {
        return $this->analytics($request);
    }

    /**
     * Export attendance history (delegates to export)
     */
    public function exportHistory(Request $request)
    {
        return $this->export($request);
    }
