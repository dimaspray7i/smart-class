<?php
/**
 * PATCH FILE: Add Missing Methods to Student/AttendanceController.php
 *
 * This patch adds 8 missing methods that are defined in routes but not implemented in the controller.
 *
 * Installation:
 * 1. Add this code to the end of StudentAttendanceController class (before final })
 * 2. Make sure SimpleSoftwareIO\QrCode\Facades\QrCode is imported
 * 3. Ensure 'qrcode' package is installed: composer require simplesoftwareio/simple-qrcode
 *
 * Location: backend/app/Http/Controllers/Student/AttendanceController.php
 */

    // ═══════════════════════════════════════════════════════════
    // MISSING METHODS - RETRO VARIANTS & UTILITIES
    // These methods were called in routes but not implemented
    // ═══════════════════════════════════════════════════════════

    use Illuminate\Support\Str;
    use SimpleSoftwareIO\QrCode\Facades\QrCode;

    /**
     * Retro-themed attendance submission (delegates to store)
     */
    public function retroStore(StoreAttendanceRequest $request): JsonResponse
    {
        return $this->store($request);
    }

    /**
     * Retro-themed attendance statistics (delegates to stats)
     */
    public function retroStats(Request $request): JsonResponse
    {
        return $this->stats($request);
    }

    /**
     * Retro-themed today status (delegates to todayStatus)
     */
    public function retroTodayStatus(Request $request): JsonResponse
    {
        return $this->todayStatus($request);
    }

    /**
     * Retro-themed PKL locations (delegates to getPklLocations)
     */
    public function retroPklLocations(Request $request): JsonResponse
    {
        return $this->getPklLocations($request);
    }

    /**
     * Generate a temporary attendance code for manual entry
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generateQR(Request $request): JsonResponse
    {
        try {
            // Generate 6-character alphanumeric code
            $code = strtoupper(Str::random(6));

            // Generate QR code image
            $qrImage = QrCode::format('png')->size(300)->generate($code);
            $qrBase64 = 'data:image/png;base64,' . base64_encode($qrImage);

            return response()->json([
                'status' => 'success',
                'code' => 'QR_GENERATED',
                'message' => 'QR code berhasil dibuat.',
                'data' => [
                    'code' => $code,
                    'qr_code' => $qrBase64,
                    'valid_until' => now()->addMinutes(5)->toDateTimeString(),
                ]
            ], 200);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('StudentAttendanceController::generateQR failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat QR code.',
                'code' => 'QR_GENERATION_FAILED',
            ], 500);
        }
    }

    /**
     * Verify attendance using QR code or manual code
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function verifyQR(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'qr_code' => 'required|string|size:6',
                'lat' => 'nullable|numeric|between:-90,90',
                'lng' => 'nullable|numeric|between:-180,180',
            ]);

            // Create a store request and delegate to store()
            $storeRequest = new StoreAttendanceRequest([
                'code' => $validated['qr_code'],
                'lat' => $validated['lat'] ?? null,
                'lng' => $validated['lng'] ?? null,
            ]);

            // Copy user to the request
            $storeRequest->setUserResolver(function () use ($request) {
                return $request->user();
            });

            return $this->store($storeRequest);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi QR code gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('StudentAttendanceController::verifyQR failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memverifikasi QR code.',
                'code' => 'QR_VERIFICATION_FAILED',
            ], 500);
        }
    }

    /**
     * Get map preview of PKL locations
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function mapPreview(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            // Get PKL locations available for this student
            $locations = $this->attendanceService->getPklLocationsForStudent($user);

            return response()->json([
                'status' => 'success',
                'code' => 'MAP_PREVIEW_SUCCESS',
                'message' => 'Preview peta PKL berhasil diambil.',
                'data' => [
                    'locations' => $locations,
                    'center' => [
                        'lat' => config('app.school_latitude', -6.200000),
                        'lng' => config('app.school_longitude', 106.816666),
                    ],
                    'school_name' => config('app.school_name', 'Sekolah'),
                ]
            ], 200);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('StudentAttendanceController::mapPreview failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat preview peta.',
                'code' => 'MAP_PREVIEW_FAILED',
            ], 500);
        }
    }

    /**
     * Export attendance history as CSV or Excel
     *
     * @param Request $request
     * @return \Illuminate\Http\Response|JsonResponse
     */
    public function exportHistory(Request $request)
    {
        try {
            $validated = $request->validate([
                'format' => 'required|in:csv,xlsx',
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date|after_or_equal:from_date',
            ]);

            // Get the export service
            $exportService = app('App\Services\AttendanceExportService');

            $result = $exportService->exportAttendance(
                $request->user()->id,
                [
                    'format' => $validated['format'],
                    'date_from' => $validated['from_date'] ?? null,
                    'date_to' => $validated['to_date'] ?? null,
                ]
            );

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

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi parameter export gagal.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('StudentAttendanceController::exportHistory failed', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengexport riwayat absensi.',
                'code' => 'EXPORT_ERROR',
            ], 500);
        }
    }
