<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\PklLocation;
use App\Models\User;
use App\Helpers\GeoHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\ImageManager;
use Exception;

class AttendanceService
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new GdDriver());
    }
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

            // ═══════════════════════════════════════════════════════════
            // PKL LOCATION VALIDATION FOR CLASS 12 STUDENTS
            // ═══════════════════════════════════════════════════════════
            $userProfile = $user->profile;
            $isClass12 = $userProfile && $userProfile->class_level === 'XII';
            $pklEnabled = config('app.pkl_enable_pkl_attendance', true);
            
            // Default values (school location)
            $maxRadius = $session->radius_meters ?? config('app.attendance_radius_meters', 100);
            $centerLat = $session->center_lat ?? config('app.school_latitude', -6.200000);
            $centerLng = $session->center_lng ?? config('app.school_longitude', 106.816666);
            
            $isPklLocation = false;
            $matchedPklLocation = null;

            // If class 12 and PKL enabled, check approved PKL locations
            if ($isClass12 && $pklEnabled) {
                $approvedPklLocations = PklLocation::approved()->get();
                
                foreach ($approvedPklLocations as $pklLoc) {
                    $distance = GeoHelper::calculateDistance(
                        $data['lat'], $data['lng'],
                        $pklLoc->latitude, $pklLoc->longitude
                    );
                    
                    if ($distance <= $pklLoc->radius_meters) {
                        // Found matching PKL location! Use its radius and center
                        $maxRadius = $pklLoc->radius_meters;
                        $centerLat = $pklLoc->latitude;
                        $centerLng = $pklLoc->longitude;
                        $isPklLocation = true;
                        $matchedPklLocation = $pklLoc;
                        break;
                    }
                }
            }

            // 3. Validate: GPS accuracy threshold
            $accuracy = isset($data['accuracy']) ? (int) $data['accuracy'] : null;
            $minAccuracyThreshold = config('app.attendance_min_gps_accuracy', 50); // meters

            if ($accuracy !== null && $accuracy > $minAccuracyThreshold) {
                DB::rollBack();
                return [
                    'success' => false,
                    'message' => sprintf('Akurasi GPS kurang baik (%d m). Pastikan GPS aktif dan coba lagi.', $accuracy),
                    'code' => 'POOR_GPS_ACCURACY',
                    'debug' => config('app.debug') ? [
                        'accuracy_meters' => $accuracy,
                        'threshold_meters' => $minAccuracyThreshold,
                    ] : null,
                ];
            }

            // 4. Validate: Location radius (using determined center & radius)
            $distance = GeoHelper::calculateDistance(
                $data['lat'],
                $data['lng'],
                $centerLat,
                $centerLng
            );

            if ($distance > $maxRadius) {
                DB::rollBack();
                
                $errorMsg = $isPklLocation 
                    ? sprintf('Lokasi terlalu jauh (%.0f m) dari titik PKL. Maksimal %d m.', $distance, $maxRadius)
                    : sprintf('Lokasi terlalu jauh (%.0f m). Maksimal %d m dari titik absensi.', $distance, $maxRadius);
                
                return [
                    'success' => false,
                    'message' => $errorMsg,
                    'code' => 'OUT_OF_RADIUS',
                    'debug' => config('app.debug') ? [
                        'distance' => round($distance),
                        'max_radius' => $maxRadius,
                        'your_location' => ['lat' => $data['lat'], 'lng' => $data['lng']],
                        'center_location' => ['lat' => $centerLat, 'lng' => $centerLng],
                        'is_pkl_location' => $isPklLocation,
                        'pkl_location_name' => $matchedPklLocation?->company_name,
                    ] : null,
                ];
            }

            // 5. Validate: Time window
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

            // 6. Determine status (Hadir/Terlambat)
            $scheduledStartTime = $this->getClassStartTime($user, $session->class_id);
            $status = $scheduledStartTime && $now->gt($scheduledStartTime)
                ? 'Terlambat'
                : 'Hadir';

            // 7. Create attendance record
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
                // PKL Fields
                'pkl_location_id' => $matchedPklLocation?->id,
                'location_name' => $matchedPklLocation?->company_name,
            ]);

            // 8. Increment session usage counter
            $session->incrementUsage();

            DB::commit();

            return [
                'success' => true,
                'message' => $isPklLocation 
                    ? 'Absensi PKL berhasil dicatat.' 
                    : 'Absensi berhasil dicatat.',
                'code' => 'ATTENDANCE_SUCCESS',
                'data' => $attendance->load('user:id,name,avatar_url', 'pklLocation:id,company_name'),
                'meta' => [
                    'status' => $status,
                    'distance_from_center' => round($distance) . ' m',
                    'location_type' => $isPklLocation ? 'pkl' : 'school',
                    'location_name' => $matchedPklLocation?->company_name ?? 'Sekolah',
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
     * Get attendance history with filters (STUDENT version)
     */
    public function getStudentHistory(int $userId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Attendance::where('user_id', $userId)
            ->with('pklLocation:id,company_name,address')
            ->orderBy('date', 'desc');

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
        if (isset($filters['pkl_only']) && filter_var($filters['pkl_only'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNotNull('pkl_location_id');
        }

        // Retention policy
        $retentionDays = config('app.analytics_retention_days', 90);
        $query->where('date', '>=', Carbon::today()->subDays($retentionDays));

        return $query->paginate($filters['per_page'] ?? 15);
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
        $pklCount = Attendance::where('user_id', $userId)->whereNotNull('pkl_location_id')->where('date', '>=', $since)->count();

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
                'pkl_count' => $pklCount,
            ],
            'percentage' => [
                'hadir' => $total > 0 ? round(($hadir / $total) * 100, 2) : 0,
                'on_time' => $total > 0 ? round((($hadir + $terlambat) / $total) * 100, 2) : 0,
                'pkl' => $total > 0 ? round(($pklCount / $total) * 100, 2) : 0,
            ],
            'streak' => $this->calculateCurrentStreak($userId),
            'last_attendance' => Attendance::where('user_id', $userId)
                ->with('pklLocation:id,company_name')
                ->latest('date')
                ->first(['date', 'status', 'created_at', 'pkl_location_id'])
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
            ->with('pklLocation:id,company_name')
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
     * Get approved PKL locations for class 12 student
     */
    public function getPklLocationsForStudent(User $user): array
    {
        $userProfile = $user->profile;
        
        // Only class 12 students can use PKL locations
        if (!$userProfile || $userProfile->class_level !== 'XII') {
            return [];
        }

        if (!config('app.pkl_enable_pkl_attendance', true)) {
            return [];
        }

        $locations = PklLocation::approved()
            ->select('id', 'company_name', 'address', 'latitude', 'longitude', 'radius_meters', 'supervisor_name', 'supervisor_phone')
            ->orderBy('company_name')
            ->get();

        return $locations->map(function ($loc) {
            return [
                'id' => $loc->id,
                'company_name' => $loc->company_name,
                'address' => $loc->address,
                'latitude' => $loc->latitude,
                'longitude' => $loc->longitude,
                'radius_meters' => $loc->radius_meters,
                'supervisor_name' => $loc->supervisor_name,
                'supervisor_phone' => $loc->supervisor_phone,
                'google_maps_url' => $loc->google_maps_url,
            ];
        })->toArray();
    }

    /**
     * Validate if student can attend at given coordinates
     */
    public function validateAttendanceLocation(User $user, float $lat, float $lng): array
    {
        $result = [
            'can_attend' => false,
            'location_type' => null,
            'location_name' => null,
            'distance' => null,
            'max_radius' => null,
            'message' => '',
        ];

        // Check school location first
        $schoolLat = config('app.school_latitude', -6.200000);
        $schoolLng = config('app.school_longitude', 106.816666);
        $schoolRadius = config('app.attendance_radius_meters', 100);
        
        $distanceToSchool = GeoHelper::calculateDistance(
            $lat, $lng, $schoolLat, $schoolLng
        );

        if ($distanceToSchool <= $schoolRadius) {
            $result['can_attend'] = true;
            $result['location_type'] = 'school';
            $result['location_name'] = config('app.school_name', 'Sekolah');
            $result['distance'] = round($distanceToSchool);
            $result['max_radius'] = $schoolRadius;
            $result['message'] = 'Lokasi valid (dalam radius sekolah).';
            return $result;
        }

        // If class 12, check approved PKL locations
        $userProfile = $user->profile;
        $isClass12 = $userProfile && $userProfile->class_level === 'XII';
        
        if ($isClass12 && config('app.pkl_enable_pkl_attendance', true)) {
            $approvedPklLocations = PklLocation::approved()->get();
            
            foreach ($approvedPklLocations as $pklLoc) {
                $distanceToPkl = GeoHelper::calculateDistance(
                    $lat, $lng, $pklLoc->latitude, $pklLoc->longitude
                );
                
                if ($distanceToPkl <= $pklLoc->radius_meters) {
                    $result['can_attend'] = true;
                    $result['location_type'] = 'pkl';
                    $result['location_name'] = $pklLoc->company_name;
                    $result['distance'] = round($distanceToPkl);
                    $result['max_radius'] = $pklLoc->radius_meters;
                    $result['message'] = "Lokasi valid (dalam radius {$pklLoc->company_name}).";
                    return $result;
                }
            }
        }

        // If we reach here, location is not valid
        $result['message'] = 'Lokasi tidak valid. Pastikan Anda berada di sekolah atau lokasi PKL yang disetujui.';
        $result['distance'] = round($distanceToSchool);
        $result['max_radius'] = $schoolRadius;
        
        return $result;
    }

    /**
     * Verify attendance code and create a pending attendance record.
     */
    public function verifyAttendanceCode(User $user, string $code, ?string $deviceInfo = null, ?string $browserInfo = null, ?string $ipAddress = null): array
    {
        $session = AttendanceSession::validCode($code)->first();

        if (!$session) {
            return [
                'success' => false,
                'message' => 'Kode absensi tidak valid atau sudah kedaluwarsa.',
                'code' => 'INVALID_CODE',
            ];
        }

        $record = AttendanceRecord::firstOrCreate(
            [
                'student_id' => $user->id,
                'verification_code' => strtoupper($code),
            ],
            [
                'attendance_session_id' => $session->id,
                'device_info' => $deviceInfo,
                'browser_info' => $browserInfo,
                'ip_address' => $ipAddress,
                'status' => 'pending',
            ]
        );

        $record->update([
            'attendance_session_id' => $session->id,
            'device_info' => $deviceInfo ?? $record->device_info,
            'browser_info' => $browserInfo ?? $record->browser_info,
            'ip_address' => $ipAddress ?? $record->ip_address,
        ]);

        return [
            'success' => true,
            'message' => 'Kode absensi valid. Lanjutkan verifikasi wajah.',
            'code' => 'CODE_VERIFIED',
            'data' => [
                'attendance_record_id' => $record->id,
                'session' => [
                    'id' => $session->id,
                    'code' => $session->code,
                    'valid_from' => $session->valid_from?->toDateTimeString(),
                    'valid_until' => $session->valid_until?->toDateTimeString(),
                    'radius_meters' => $session->radius_meters,
                    'center_lat' => $session->center_lat,
                    'center_lng' => $session->center_lng,
                    'class_id' => $session->class_id,
                    'class_name' => $session->class?->name,
                    'subject_name' => $session->subject?->name,
                ],
            ],
        ];
    }

    /**
     * Verify student selfie against stored avatar.
     */
    public function verifyFace(User $user, int $recordId, string $selfiePath, ?string $deviceInfo = null, ?string $browserInfo = null, ?string $ipAddress = null): array
    {
        $record = AttendanceRecord::find($recordId);

        if (!$record || $record->student_id !== $user->id) {
            return [
                'success' => false,
                'message' => 'Rekaman absensi tidak ditemukan.',
                'code' => 'RECORD_NOT_FOUND',
            ];
        }

        if (!$user->avatar_url) {
            return [
                'success' => false,
                'message' => 'Foto profil siswa belum tersedia. Unggah avatar terlebih dahulu.',
                'code' => 'NO_PROFILE_PHOTO',
            ];
        }

        $avatarPath = $this->resolveAvatarLocalPath($user->avatar_url);
        if (!$avatarPath || !file_exists($avatarPath)) {
            return [
                'success' => false,
                'message' => 'Foto profil tidak ditemukan di server.',
                'code' => 'PROFILE_PHOTO_MISSING',
            ];
        }

        Log::error('AttendanceService::verifyFace debug', [
            'selfie_path' => $selfiePath,
            'selfie_exists' => file_exists($selfiePath),
            'avatar_path' => $avatarPath,
            'avatar_exists' => file_exists($avatarPath),
        ]);

        try {
            $faceScore = $this->getFaceSimilarityScore($selfiePath, $avatarPath);
            $image = $this->imageManager->read($selfiePath);

            if ($this->isImageBlurred($image)) {
                return [
                    'success' => false,
                    'message' => 'Gambar selfie buram. Silakan ulangi dengan foto yang lebih tajam.',
                    'code' => 'BLURRY_IMAGE',
                ];
            }

            if ($faceScore < 1) {
                return [
                    'success' => false,
                    'message' => 'Wajah tidak terdeteksi dengan benar. Pastikan wajah terlihat jelas.',
                    'code' => 'NO_FACE_DETECTED',
                ];
            }

            $verified = $faceScore >= 80;
            $record->update([
                'selfie_photo' => $this->storeSelfieImage($selfiePath, $record->student_id, $record->id),
                'face_score' => $faceScore,
                'face_verified' => $verified,
                'status' => $verified ? 'face_verified' : 'failed',
                'device_info' => $deviceInfo ?? $record->device_info,
                'browser_info' => $browserInfo ?? $record->browser_info,
                'ip_address' => $ipAddress ?? $record->ip_address,
            ]);

            return [
                'success' => $verified,
                'message' => $verified ? 'Verifikasi wajah berhasil.' : 'Wajah tidak cocok dengan profil siswa.',
                'code' => $verified ? 'FACE_VERIFIED' : 'FACE_MISMATCH',
                'data' => [
                    'attendance_record_id' => $record->id,
                    'face_score' => $faceScore,
                    'face_verified' => $verified,
                    'selfie_photo' => $record->selfie_photo,
                ],
            ];
        } catch (Exception $e) {
            Log::error('AttendanceService::verifyFace failed', [
                'user_id' => $user->id,
                'record_id' => $recordId,
                'selfie_path' => $selfiePath,
                'avatar_path' => $avatarPath,
                'selfie_exists' => file_exists($selfiePath),
                'avatar_exists' => file_exists($avatarPath),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memverifikasi wajah. Silakan coba lagi.',
                'code' => 'FACE_VERIFY_ERROR',
            ];
        }
    }

    /**
     * Verify student location against school geofence.
     */
    public function verifyAttendanceLocation(User $user, int $recordId, float $lat, float $lng, int $accuracy, ?string $deviceInfo = null, ?string $browserInfo = null, ?string $ipAddress = null): array
    {
        $record = AttendanceRecord::find($recordId);

        if (!$record || $record->student_id !== $user->id) {
            return [
                'success' => false,
                'message' => 'Rekaman absensi tidak ditemukan.',
                'code' => 'RECORD_NOT_FOUND',
            ];
        }

        if ($accuracy > 50) {
            return [
                'success' => false,
                'message' => 'Akurasi GPS kurang baik. Pastikan lokasi aktif dan coba lagi.',
                'code' => 'POOR_GPS_ACCURACY',
            ];
        }

        $schoolLat = config('app.school_latitude', -6.200000);
        $schoolLng = config('app.school_longitude', 106.816666);
        $radius = config('app.attendance_radius_meters', 100);

        $distance = GeoHelper::calculateDistance($lat, $lng, $schoolLat, $schoolLng);
        $verified = $distance <= $radius;

        $record->update([
            'latitude' => $lat,
            'longitude' => $lng,
            'accuracy' => $accuracy,
            'distance_from_school' => round($distance),
            'location_verified' => $verified,
            'status' => $verified ? ($record->face_verified ? 'location_verified' : $record->status) : 'failed',
            'device_info' => $deviceInfo ?? $record->device_info,
            'browser_info' => $browserInfo ?? $record->browser_info,
            'ip_address' => $ipAddress ?? $record->ip_address,
        ]);

        return [
            'success' => $verified,
            'message' => $verified ? 'Lokasi valid. Lanjutkan check-in.' : 'Anda berada di luar area sekolah.',
            'code' => $verified ? 'LOCATION_VERIFIED' : 'OUT_OF_GEOFENCE',
            'data' => [
                'attendance_record_id' => $record->id,
                'latitude' => $lat,
                'longitude' => $lng,
                'accuracy' => $accuracy,
                'distance_from_school' => round($distance),
                'location_verified' => $verified,
            ],
        ];
    }

    /**
     * Complete the check-in and save attendance.
     */
    public function completeCheckIn(User $user, int $recordId): array
    {
        $record = AttendanceRecord::find($recordId);

        if (!$record || $record->student_id !== $user->id) {
            return [
                'success' => false,
                'message' => 'Rekaman absensi tidak ditemukan.',
                'code' => 'RECORD_NOT_FOUND',
            ];
        }

        if (!$record->face_verified) {
            return [
                'success' => false,
                'message' => 'Verifikasi wajah belum berhasil.',
                'code' => 'FACE_NOT_VERIFIED',
            ];
        }

        if (!$record->location_verified) {
            return [
                'success' => false,
                'message' => 'Lokasi belum terverifikasi.',
                'code' => 'LOCATION_NOT_VERIFIED',
            ];
        }

        $today = today()->toDateString();
        if (Attendance::where('user_id', $user->id)->where('date', $today)->exists()) {
            return [
                'success' => false,
                'message' => 'Anda sudah absen hari ini.',
                'code' => 'ALREADY_ATTENDED',
            ];
        }

        $session = AttendanceSession::validCode($record->verification_code)->first();
        if (!$session) {
            return [
                'success' => false,
                'message' => 'Kode absensi tidak lagi valid.',
                'code' => 'INVALID_CODE',
            ];
        }

        $status = 'Hadir';
        $scheduledStartTime = $this->getClassStartTime($user, $session->class_id);
        if ($scheduledStartTime && now()->gt($scheduledStartTime)) {
            $status = 'Terlambat';
        }

        $attendance = Attendance::create([
            'user_id' => $user->id,
            'date' => $today,
            'lat' => $record->latitude,
            'lng' => $record->longitude,
            'status' => $status,
            'photo_url' => $record->selfie_photo,
            'code_used' => strtoupper($record->verification_code),
            'device_info' => $record->device_info ?? 'web',
            'verification_method' => 'auto',
            'notes' => sprintf('Face score %d, distance %dm, accuracy %dm', $record->face_score, $record->distance_from_school ?? 0, $record->accuracy ?? 0),
            'pkl_location_id' => $session->pkl_location_id,
            'location_name' => $session->pklLocation?->company_name,
        ]);

        $session->increment('used_count');
        $record->update(['status' => 'completed']);

        return [
            'success' => true,
            'message' => 'Absensi berhasil dicatat.',
            'code' => 'CHECKIN_SUCCESS',
            'data' => $attendance,
        ];
    }

    protected function resolveAvatarLocalPath(?string $avatarUrl): ?string
    {
        if (!$avatarUrl) {
            return null;
        }

        $parsed = parse_url($avatarUrl);
        $path = $parsed['path'] ?? null;
        if (!$path) {
            return null;
        }

        $relative = preg_replace('#^/storage/#', '', $path);
        return $relative ? Storage::disk('public')->path($relative) : null;
    }

    protected function getFaceSimilarityScore(string $selfiePath, string $avatarPath): int
    {
        $selfie = $this->imageManager->read($selfiePath)->resize(32, 32)->greyscale();
        $avatar = $this->imageManager->read($avatarPath)->resize(32, 32)->greyscale();

        $selfieHash = $this->imageHash($selfie);
        $avatarHash = $this->imageHash($avatar);
        $distance = levenshtein($selfieHash, $avatarHash);
        $score = max(0, 100 - ($distance / strlen($selfieHash)) * 100);

        return (int) round($score);
    }

    protected function isImageBlurred($image): bool
    {
        $resized = $image->resize(64, 64)->greyscale();
        $pixels = [];
        for ($x = 0; $x < 64; $x++) {
            for ($y = 0; $y < 64; $y++) {
                $color = $resized->pickColor($x, $y);
                $channels = $color->toArray();
                $pixels[] = $channels[0] ?? 0;
            }
        }

        $mean = array_sum($pixels) / max(1, count($pixels));
        $variance = array_sum(array_map(fn($v) => pow($v - $mean, 2), $pixels)) / max(1, count($pixels));

        return $variance < 120;
    }

    protected function imageHash($image): string
    {
        $pixels = [];
        for ($x = 0; $x < 8; $x++) {
            for ($y = 0; $y < 8; $y++) {
                $color = $image->pickColor($x, $y);
                $channels = $color->toArray();
                $pixels[] = $channels[0] ?? 0;
            }
        }

        $avg = array_sum($pixels) / count($pixels);
        return implode('', array_map(fn($value) => $value >= $avg ? '1' : '0', $pixels));
    }

    protected function storeSelfieImage(string $selfiePath, int $studentId, int $recordId): string
    {
        $filename = sprintf('attendance_selfies/%s_%s_%s.jpg', $studentId, $recordId, time());
        $image = $this->imageManager->read($selfiePath)->encodeByExtension('jpg', 80);
        Storage::disk('public')->put($filename, (string) $image);
        return asset('storage/' . $filename);
    }

    /**
     * Create attendance session for teacher
     */
    public function createSession(int $teacherId, array $data): array
    {
        try {
            // ═══════════════════════════════════════════════════════
            // STEP 1: CALCULATE DURATION FROM TIME WINDOW
            // ═══════════════════════════════════════════════════════
            if (isset($data['start_time']) && isset($data['end_time'])) {
                try {
                    $start = Carbon::createFromFormat('H:i', $data['start_time']);
                    $end = Carbon::createFromFormat('H:i', $data['end_time']);

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
                    $data['duration_minutes'] = config('app.attendance_code_duration_minutes', 10);
                }
            } else {
                $data['duration_minutes'] = $data['duration_minutes'] ?? config('app.attendance_code_duration_minutes', 10);
            }

            $duration = $data['duration_minutes'];

            // ═══════════════════════════════════════════════════════
            // STEP 2: VERIFY TEACHER HAS ACCESS TO CLASS
            // ═══════════════════════════════════════════════════════
            $hasAccess = false;

            $hasSchedule = \App\Models\Schedule::where('teacher_id', $teacherId)
                ->where('class_id', $data['class_id'])
                ->exists();

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
            $sessionDate = now()->toDateString();
            $validFrom = now();
            $validUntil = now()->addMinutes($duration);

            if (isset($data['date'])) {
                try {
                    $sessionDate = Carbon::createFromFormat('Y-m-d', $data['date'])->toDateString();

                    if (!$isManual && isset($data['start_time'])) {
                        $validFrom = Carbon::createFromFormat(
                            'Y-m-d H:i',
                            $sessionDate . ' ' . $data['start_time']
                        );

                        $validUntil = $validFrom->copy()->addMinutes($duration);
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to parse date', ['error' => $e->getMessage()]);
                }
            }

            // ═══════════════════════════════════════════════════════
            // STEP 5: GENERATE UNIQUE CODE
            // ═══════════════════════════════════════════════════════
            $code = strtoupper(Str::random(6));

            $attempts = 0;
            while (AttendanceSession::where('code', $code)->exists() && $attempts < 5) {
                $code = strtoupper(Str::random(6));
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
            $session = AttendanceSession::create([
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

        } catch (Exception $e) {
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

    /**
     * Generate attendance session automatically from a schedule
     */
    public function generateFromSchedule(int $scheduleId, int $teacherId): array
    {
        try {
            // Find schedule
            $schedule = \App\Models\Schedule::with(['class', 'subject'])->find($scheduleId);

            if (!$schedule) {
                return [
                    'success' => false,
                    'message' => 'Jadwal tidak ditemukan.',
                    'code' => 'SCHEDULE_NOT_FOUND',
                ];
            }

            // Verify teacher
            if ($schedule->teacher_id !== $teacherId) {
                return [
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke jadwal ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            // Verify active schedule
            if (!$schedule->is_active) {
                return [
                    'success' => false,
                    'message' => 'Jadwal ini sedang dinonaktifkan.',
                    'code' => 'SCHEDULE_INACTIVE',
                ];
            }

            $todayDay = strtolower(now()->locale('id')->dayName);
            if ($todayDay === 'minggu') {
                $todayDay = 'senin'; // Fallback for Sunday testing
            }
            
            if ($schedule->day !== $todayDay) {
                return [
                    'success' => false,
                    'message' => "Jadwal ini dijadwalkan pada hari " . ucfirst($schedule->day) . ", sedangkan hari ini adalah hari " . ucfirst($todayDay) . ".",
                    'code' => 'INVALID_SCHEDULE_DAY',
                ];
            }

            // Verify time window
            $now = now();
            $startTimeStr = Carbon::parse($schedule->start_time)->format('H:i:s');
            $endTimeStr = Carbon::parse($schedule->end_time)->format('H:i:s');
            
            $startTimeToday = Carbon::today()->setTimeFromTimeString($startTimeStr)->subMinutes(30);
            $endTimeToday = Carbon::today()->setTimeFromTimeString($endTimeStr);

            if (!$now->between($startTimeToday, $endTimeToday)) {
                return [
                    'success' => false,
                    'message' => "Anda hanya bisa membuat absensi pada jam pelajaran aktif (" . Carbon::parse($schedule->start_time)->format('H:i') . " - " . Carbon::parse($schedule->end_time)->format('H:i') . "). Sesi dapat dibuat maksimal 30 menit sebelum jam pelajaran dimulai.",
                    'code' => 'OUT_OF_SCHEDULE_TIME',
                ];
            }

            // Verify duplicate active session today for this schedule
            $today = Carbon::today()->toDateString();
            $existing = AttendanceSession::where('schedule_id', $scheduleId)
                ->whereDate('created_at', $today)
                ->where('is_active', true)
                ->first();

            if ($existing) {
                return [
                    'success' => true,
                    'message' => 'Sesi absensi untuk jadwal ini sudah aktif.',
                    'code' => 'SESSION_ALREADY_ACTIVE',
                    'data' => [
                        'id' => $existing->id,
                        'code' => $existing->code,
                        'valid_from' => $existing->valid_from,
                        'valid_until' => Carbon::parse($existing->valid_until)->format('H:i:s'),
                        'is_active' => $existing->is_active,
                        'radius_meters' => $existing->radius_meters,
                        'center_lat' => $existing->center_lat,
                        'center_lng' => $existing->center_lng,
                        'class' => [
                            'id' => $schedule->class->id,
                            'name' => $schedule->class->name,
                        ],
                        'subject' => [
                            'id' => $schedule->subject->id,
                            'name' => $schedule->subject->name,
                        ]
                    ]
                ];
            }

            // Create automatic attendance session
            $code = strtoupper(\Illuminate\Support\Str::random(6));

            $session = AttendanceSession::create([
                'code' => $code,
                'class_id' => $schedule->class_id,
                'schedule_id' => $schedule->id,
                'subject_id' => $schedule->subject_id,
                'generated_by' => $teacherId,
                'valid_from' => now(),
                'valid_until' => $endTimeToday,
                'is_active' => true,
                'max_uses' => null,
                'used_count' => 0,
                'radius_meters' => config('app.attendance_radius_meters', 100),
                'center_lat' => config('app.school_latitude', -6.200000),
                'center_lng' => config('app.school_longitude', 106.816666),
                'location' => $schedule->room ?? 'Ruang Kelas',
                'notes' => 'Otomatis dibuat dari Jadwal ' . $schedule->subject->name,
            ]);

            return [
                'success' => true,
                'message' => 'Sesi absensi otomatis berhasil dibuat.',
                'code' => 'SESSION_CREATED',
                'data' => [
                    'id' => $session->id,
                    'code' => $session->code,
                    'valid_from' => $session->valid_from,
                    'valid_until' => $session->valid_until->format('H:i:s'),
                    'is_active' => $session->is_active,
                    'radius_meters' => $session->radius_meters,
                    'center_lat' => $session->center_lat,
                    'center_lng' => $session->center_lng,
                    'class' => [
                        'id' => $schedule->class->id,
                        'name' => $schedule->class->name,
                    ],
                    'subject' => [
                        'id' => $schedule->subject->id,
                        'name' => $schedule->subject->name,
                    ]
                ],
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::generateFromSchedule failed', [
                'teacher_id' => $teacherId,
                'schedule_id' => $scheduleId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat sesi absensi otomatis.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Generate new code for existing session
     */
    public function generateCode(int $sessionId, int $teacherId, array $options = []): array
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
    public function closeSession(int $sessionId, int $teacherId, array $options = []): array
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

            if (!$session->is_active) {
                return [
                    'success' => false,
                    'message' => 'Sesi sudah dalam keadaan tertutup.',
                    'code' => 'SESSION_ALREADY_CLOSED',
                ];
            }

            // Auto-mark absent if requested
            if (!empty($options['auto_mark_absent'])) {
                $classStudentIds = DB::table('class_user')
                    ->where('class_id', $session->class_id)
                    ->where('role_in_class', 'siswa')
                    ->where('is_active', true)
                    ->pluck('user_id');

                $attendedIds = Attendance::where('code_used', $session->code)
                    ->pluck('user_id');

                $absentIds = $classStudentIds->diff($attendedIds);
                $today = Carbon::today()->toDateString();

                foreach ($absentIds as $studentId) {
                    Attendance::firstOrCreate(
                        ['user_id' => $studentId, 'date' => $today],
                        [
                            'status' => 'Alpha',
                            'code_used' => $session->code,
                            'device_info' => 'auto-marked',
                            'verification_method' => 'auto',
                        ]
                    );
                }
            }

            $session->update([
                'is_active' => false,
                'status' => 'closed',
            ]);

            $attended = Attendance::where('code_used', $session->code)->count();

            return [
                'success' => true,
                'message' => 'Sesi absensi ditutup.',
                'code' => 'SESSION_CLOSED',
                'data' => [
                    'session_id' => $session->id,
                    'attended_count' => $attended,
                    'closed_at' => now()->toDateTimeString(),
                ],
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
     * Reopen a closed attendance session
     */
    public function reopenSession(int $sessionId, int $teacherId, array $options = []): array
    {
        try {
            $session = AttendanceSession::find($sessionId);

            if (!$session) {
                return ['success' => false, 'message' => 'Sesi tidak ditemukan.', 'code' => 'SESSION_NOT_FOUND'];
            }

            if ($session->generated_by !== $teacherId) {
                return ['success' => false, 'message' => 'Tidak memiliki akses ke sesi ini.', 'code' => 'FORBIDDEN'];
            }

            if ($session->is_active) {
                return ['success' => false, 'message' => 'Sesi masih dalam keadaan aktif.', 'code' => 'SESSION_ALREADY_ACTIVE'];
            }

            // Generate a fresh code
            $newCode = strtoupper(\Illuminate\Support\Str::random(6));
            $extraMinutes = (int)($options['extra_minutes'] ?? 15);
            $newValidUntil = now()->addMinutes($extraMinutes);

            $session->update([
                'is_active'    => true,
                'status'       => 'reopened',
                'code'         => $newCode,
                'valid_from'   => now(),
                'valid_until'  => $newValidUntil,
                'reopened_by'  => $teacherId,
                'reopened_at'  => now(),
                'reopen_notes' => $options['notes'] ?? null,
                'reopen_count' => DB::raw('reopen_count + 1'),
            ]);

            return [
                'success' => true,
                'message' => 'Sesi berhasil dibuka ulang.',
                'code'    => 'SESSION_REOPENED',
                'data'    => [
                    'id'          => $session->id,
                    'code'        => $newCode,
                    'valid_until' => $newValidUntil->format('H:i:s'),
                    'extra_minutes' => $extraMinutes,
                    'reopen_count'  => $session->fresh()->reopen_count,
                ],
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::reopenSession failed', [
                'session_id' => $sessionId,
                'error'      => $e->getMessage(),
            ]);
            return ['success' => false, 'message' => 'Gagal membuka ulang sesi.', 'code' => 'SERVER_ERROR'];
        }
    }

    /**
     * Monitor attendance session (get real-time stats)
     */
    public function monitorSession(int $sessionId, int $teacherId = 0, array $options = []): array
    {
        $session = AttendanceSession::with(['class', 'subject', 'teacher:id,name', 'pklLocation:id,company_name'])->find($sessionId);

        if (!$session) {
            return [
                'success' => false,
                'message' => 'Sesi tidak ditemukan.',
                'code'    => 'SESSION_NOT_FOUND',
            ];
        }

        // Teachers can only monitor their own sessions
        if ($teacherId > 0 && $session->generated_by !== $teacherId) {
            return [
                'success' => false,
                'message' => 'Tidak memiliki akses ke sesi ini.',
                'code'    => 'FORBIDDEN',
            ];
        }

        $attendances = Attendance::where('code_used', $session->code)
            ->with('user:id,name,avatar_url')
            ->latest()
            ->get();

        $totalStudents = $session->class
            ? DB::table('class_user')
                ->where('class_id', $session->class_id)
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->count()
            : 0;

        return [
            'success' => true,
            'data' => [
                'session'        => $session,
                'total_students' => $totalStudents,
                'attended_count' => $attendances->count(),
                'late_count'     => $attendances->where('status', 'Terlambat')->count(),
                'remaining_uses' => $session->remaining_uses,
                'is_valid'       => $session->is_valid,
                'remaining_time' => $session->remaining_time,
                'is_pkl_session' => $session->pkl_location_id !== null,
                'pkl_location'   => $session->pklLocation,
                'attendances'    => $options['include_students'] ?? false ? $attendances : [],
                'status'         => $session->status ?? ($session->is_active ? 'active' : 'closed'),
            ],
        ];
    }

    /**
     * Get teacher's attendance history
     */
    public function getTeacherHistory(int $teacherId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        // Get classes taught by this teacher
        $teacherClasses = DB::table('class_user')
            ->where('user_id', $teacherId)
            ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
            ->where('is_active', true)
            ->pluck('class_id')
            ->toArray();

        if (empty($teacherClasses)) {
            $studentIds = collect([]);
        } else {
            // Filter by class_id if provided and teacher is assigned to it
            $classFilter = !empty($filters['class_id']) ? (int)$filters['class_id'] : null;
            if ($classFilter && !in_array($classFilter, $teacherClasses)) {
                $studentIds = collect([]);
            } else {
                $studentIds = DB::table('class_user')
                    ->where('role_in_class', 'siswa')
                    ->where('is_active', true)
                    ->when($classFilter, function ($q) use ($classFilter) {
                        return $q->where('class_id', $classFilter);
                    }, function ($q) use ($teacherClasses) {
                        return $q->whereIn('class_id', $teacherClasses);
                    })
                    ->pluck('user_id');
            }
        }

        $query = Attendance::whereIn('user_id', $studentIds)
            ->with(['user:id,name,avatar_url', 'pklLocation:id,company_name'])
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
        if (!empty($filters['pkl_only']) && filter_var($filters['pkl_only'], FILTER_VALIDATE_BOOLEAN)) {
            $query->whereNotNull('pkl_location_id');
        }

        return $query->paginate($filters['per_page'] ?? 20);
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

            // Verify teacher has access to this student (shares at least one active class)
            $teacherClasses = DB::table('class_user')
                ->where('user_id', $teacherId)
                ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
                ->where('is_active', true)
                ->pluck('class_id')
                ->toArray();

            $isAuthorized = false;
            if (!empty($teacherClasses)) {
                $isAuthorized = DB::table('class_user')
                    ->whereIn('class_id', $teacherClasses)
                    ->where('user_id', $attendance->user_id)
                    ->where('role_in_class', 'siswa')
                    ->where('is_active', true)
                    ->exists();
            }

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
                'data' => $attendance->fresh()->load('user:id,name,avatar_url', 'pklLocation:id,company_name'),
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
            ->where('user_id', $teacherId)
            ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
            ->where('class_user.is_active', true)
            ->join('classes', 'class_user.class_id', '=', 'classes.id')
            ->select('classes.*', 'class_user.role_in_class', 'class_user.academic_year')
            ->get();

        return $classes->toArray();
    }

    /**
     * Get attendance sessions created by a teacher
     */
    public function getSessions(int $teacherId, array $filters = [], int $perPage = 15): array
    {
        try {
            $query = \App\Models\AttendanceSession::where('generated_by', $teacherId)
                ->with(['class:id,name', 'subject:id,name', 'schedule:id,day,start_time,end_time']);

            // Apply filters
            if (isset($filters['status']) && $filters['status'] !== '') {
                if ($filters['status'] === 'active') {
                    $query->where('is_active', true);
                } elseif ($filters['status'] === 'closed') {
                    $query->where('is_active', false);
                }
            }
            if (!empty($filters['class_id'])) {
                $query->where('class_id', $filters['class_id']);
            }
            if (!empty($filters['date'])) {
                $query->whereDate('created_at', $filters['date']);
            }
            if (!empty($filters['date_from'])) {
                $query->whereDate('created_at', '>=', $filters['date_from']);
            }
            if (!empty($filters['date_to'])) {
                $query->whereDate('created_at', '<=', $filters['date_to']);
            }

            $sessions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Append attendance counts
            $items = collect($sessions->items())->map(function ($s) {
                $s->attended_count = Attendance::where('code_used', $s->code)->count();
                $s->late_count     = Attendance::where('code_used', $s->code)->where('status', 'Terlambat')->count();
                $s->total_students = DB::table('class_user')
                    ->where('class_id', $s->class_id)
                    ->where('role_in_class', 'siswa')
                    ->where('is_active', true)
                    ->count();
                $s->session_status = $s->status ?? ($s->is_active ? 'active' : 'closed');
                return $s;
            });

            return [
                'success' => true,
                'data'    => $items,
                'meta'    => [
                    'current_page' => $sessions->currentPage(),
                    'per_page'     => $sessions->perPage(),
                    'total'        => $sessions->total(),
                    'last_page'    => $sessions->lastPage(),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('AttendanceService::getSessions failed', [
                'teacher_id' => $teacherId,
                'error'      => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat data sesi absensi.',
                'code'    => 'SERVER_ERROR',
            ];
        }
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

    // ═══════════════════════════════════════════════════════════
    // TEACHER-FACING METHODS (used by AttendanceController)
    // ═══════════════════════════════════════════════════════════

    /**
     * Get teacher attendance history (paginated)
     * Called by AttendanceController::history()
     */
    public function getHistory(int $teacherId, array $filters = [], int $perPage = 20): array
    {
        try {
            // Resolve class IDs the teacher is responsible for
            $classIds = DB::table('schedules')
                ->where('teacher_id', $teacherId)
                ->where('is_active', true)
                ->pluck('class_id')
                ->unique()
                ->toArray();

            if (!empty($filters['class_id'])) {
                $classIds = array_intersect($classIds, [(int) $filters['class_id']]);
            }

            if (empty($classIds)) {
                return [
                    'success' => true,
                    'data'    => collect(),
                    'meta'    => ['current_page' => 1, 'per_page' => $perPage, 'total' => 0, 'last_page' => 1],
                ];
            }

            $studentIds = DB::table('class_user')
                ->whereIn('class_id', $classIds)
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->pluck('user_id');

            $query = Attendance::whereIn('user_id', $studentIds)
                ->with(['user:id,name,avatar_url', 'pklLocation:id,company_name'])
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
            if (!empty($filters['student_id'])) {
                $query->where('user_id', (int) $filters['student_id']);
            }
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->whereHas('user', fn($q) => $q->where('name', 'like', "%{$search}%"));
            }

            $paginated = $query->paginate($perPage);

            return [
                'success' => true,
                'data'    => $paginated->items(),
                'meta'    => [
                    'current_page' => $paginated->currentPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                    'last_page'    => $paginated->lastPage(),
                ],
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::getHistory (teacher) failed', [
                'teacher_id' => $teacherId,
                'error'      => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat riwayat absensi.',
                'code'    => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get students taught by teacher (with optional class filter & search)
     * Called by AttendanceController::students()
     */
    public function getStudents(int $teacherId, ?string $classId = null, ?string $search = null, int $perPage = 50): array
    {
        try {
            // Get class IDs from schedules
            $scheduleClassIds = DB::table('schedules')
                ->where('teacher_id', $teacherId)
                ->where('is_active', true)
                ->pluck('class_id')
                ->unique()
                ->toArray();

            // Get class IDs from class_user assignments (wali_kelas or guru_pengampu)
            $classUserIds = DB::table('class_user')
                ->where('user_id', $teacherId)
                ->where('is_active', true)
                ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
                ->pluck('class_id')
                ->unique()
                ->toArray();

            $classIds = array_unique(array_merge($scheduleClassIds, $classUserIds));

            if ($classId) {
                $classIds = in_array((int) $classId, $classIds) ? [(int) $classId] : [];
            }

            if (empty($classIds)) {
                return [
                    'success' => true,
                    'data'    => collect(),
                    'meta'    => ['current_page' => 1, 'per_page' => $perPage, 'total' => 0, 'last_page' => 1],
                ];
            }

            $query = User::where('role', 'siswa')
                ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $classIds))
                ->with(['profile', 'classes' => fn($q) => $q->whereIn('classes.id', $classIds)->select('classes.id', 'classes.name')]);

            if ($search) {
                $query->where(fn($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            }

            $paginated = $query->orderBy('name')->paginate($perPage);

            $items = collect($paginated->items())->map(function ($student) use ($teacherId) {
                $total = Attendance::where('user_id', $student->id)
                    ->whereHas('session', fn($q) => $q->where('generated_by', $teacherId))
                    ->count();
                $hadir = Attendance::where('user_id', $student->id)
                    ->whereHas('session', fn($q) => $q->where('generated_by', $teacherId))
                    ->whereIn('status', ['Hadir', 'Terlambat'])
                    ->count();

                $currentClass = $student->classes->first();

                return [
                    'id'              => $student->id,
                    'name'            => $student->name,
                    'email'           => $student->email,
                    'avatar_url'      => $student->avatar_url,
                    'nis'             => $student->profile?->nis,
                    'class_id'        => $currentClass ? $currentClass->id : null,
                    'class'           => $currentClass ? ['id' => $currentClass->id, 'name' => $currentClass->name] : null,
                    'classes'         => $student->classes->map(fn($c) => ['id' => $c->id, 'name' => $c->name]),
                    'attendance_rate' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
                    'total_sessions'  => $total,
                ];
            });

            return [
                'success' => true,
                'data'    => $items,
                'meta'    => [
                    'current_page' => $paginated->currentPage(),
                    'per_page'     => $paginated->perPage(),
                    'total'        => $paginated->total(),
                    'last_page'    => $paginated->lastPage(),
                ],
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::getStudents failed', [
                'teacher_id' => $teacherId,
                'error'      => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat daftar siswa.',
                'code'    => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get detailed attendance for a specific student (teacher view)
     * Called by AttendanceController::studentAttendance()
     */
    public function getStudentAttendance(int $teacherId, int $studentId, string $startDate, string $endDate, bool $includeStats = true): array
    {
        try {
            $student = User::with(['profile', 'classes'])->find($studentId);

            if (!$student || $student->role !== 'siswa') {
                return ['success' => false, 'message' => 'Siswa tidak ditemukan.', 'code' => 'NOT_FOUND'];
            }

            // Verify teacher has access to this student
            $teacherClassIds = DB::table('schedules')
                ->where('teacher_id', $teacherId)
                ->where('is_active', true)
                ->pluck('class_id')
                ->unique()
                ->toArray();

            $studentClassIds = DB::table('class_user')
                ->where('user_id', $studentId)
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->pluck('class_id')
                ->toArray();

            $commonClasses = array_intersect($teacherClassIds, $studentClassIds);

            if (empty($commonClasses)) {
                return ['success' => false, 'message' => 'Tidak memiliki akses ke siswa ini.', 'code' => 'FORBIDDEN'];
            }

            $records = Attendance::where('user_id', $studentId)
                ->whereBetween('date', [$startDate, $endDate])
                ->with(['session' => fn($q) => $q->select('id', 'class_id', 'subject_id', 'code', 'generated_by'), 'pklLocation:id,company_name'])
                ->orderBy('date', 'desc')
                ->get()
                ->map(fn($a) => [
                    'id'         => $a->id,
                    'date'       => $a->date,
                    'status'     => $a->status,
                    'check_in'   => $a->created_at?->format('H:i'),
                    'notes'      => $a->notes,
                    'pkl_location' => $a->pklLocation?->company_name,
                ]);

            $result = [
                'success' => true,
                'data'    => [
                    'student'   => [
                        'id'       => $student->id,
                        'name'     => $student->name,
                        'email'    => $student->email,
                        'avatar_url' => $student->avatar_url,
                        'nis'      => $student->profile?->nis,
                        'classes'  => $student->classes->map(fn($c) => ['id' => $c->id, 'name' => $c->name]),
                    ],
                    'records'   => $records,
                    'date_range' => ['from' => $startDate, 'to' => $endDate],
                ],
            ];

            if ($includeStats) {
                $total  = $records->count();
                $hadir  = $records->whereIn('status', ['Hadir', 'Terlambat'])->count();
                $alpha  = $records->where('status', 'Alpha')->count();
                $izin   = $records->whereIn('status', ['Izin', 'Sakit'])->count();

                $result['data']['stats'] = [
                    'total'           => $total,
                    'hadir'           => $hadir,
                    'alpha'           => $alpha,
                    'izin'            => $izin,
                    'attendance_rate' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
                ];
            }

            return $result;

        } catch (Exception $e) {
            Log::error('AttendanceService::getStudentAttendance failed', [
                'teacher_id' => $teacherId,
                'student_id' => $studentId,
                'error'      => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => 'Gagal memuat data absensi siswa.', 'code' => 'SERVER_ERROR'];
        }
    }

    /**
     * Export attendance data
     * Called by AttendanceController::export()
     */
    public function exportData(int $teacherId, array $options): array
    {
        try {
            $classIds = DB::table('schedules')
                ->where('teacher_id', $teacherId)
                ->where('is_active', true)
                ->pluck('class_id')
                ->unique()
                ->toArray();

            if (!empty($options['class_id'])) {
                $classIds = array_intersect($classIds, [(int) $options['class_id']]);
            }

            $studentIds = DB::table('class_user')
                ->whereIn('class_id', $classIds)
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->pluck('user_id');

            $query = Attendance::whereIn('user_id', $studentIds)
                ->with('user:id,name,email')
                ->orderBy('date', 'desc');

            if (!empty($options['start_date'])) {
                $query->whereDate('date', '>=', $options['start_date']);
            }
            if (!empty($options['end_date'])) {
                $query->whereDate('date', '<=', $options['end_date']);
            }

            $records = $query->get();

            if ($options['format'] === 'json') {
                return [
                    'success' => true,
                    'data'    => $records->map(fn($r) => [
                        'student'    => $r->user?->name,
                        'email'      => $r->user?->email,
                        'date'       => $r->date,
                        'status'     => $r->status,
                        'check_in'   => $r->created_at?->format('H:i'),
                    ]),
                ];
            }

            // CSV
            $rows   = [['Nama Siswa', 'Email', 'Tanggal', 'Status', 'Jam Masuk']];
            foreach ($records as $r) {
                $rows[] = [
                    $r->user?->name ?? '-',
                    $r->user?->email ?? '-',
                    $r->date,
                    $r->status,
                    $r->created_at?->format('H:i') ?? '-',
                ];
            }

            $csv  = '';
            foreach ($rows as $row) {
                $csv .= implode(',', array_map(fn($v) => '"' . str_replace('"', '""', $v) . '"', $row)) . "\n";
            }

            return [
                'success'      => true,
                'file_content' => $csv,
                'filename'     => 'absensi_' . now()->format('Ymd_His') . '.csv',
                'content_type' => 'text/csv',
            ];

        } catch (Exception $e) {
            Log::error('AttendanceService::exportData failed', [
                'teacher_id' => $teacherId,
                'error'      => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => 'Gagal export data.', 'code' => 'SERVER_ERROR'];
        }
    }
}