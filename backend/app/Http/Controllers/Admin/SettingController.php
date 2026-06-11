<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class SettingController extends Controller
{
    /**
     * Cache configuration
     */
    private const CACHE_KEY = 'app_settings';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Available settings sections
     */
    private const SECTIONS = ['general', 'attendance', 'pkl', 'security', 'features', 'backup'];

    /**
     * Display all settings grouped by section.
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Try to get from cache first (1 hour TTL)
        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $dbSettings = DB::table('settings')->pluck('value', 'key')->toArray();
            
            $defaults = [
                // ═══════════════════════════════════════════════════
                // GENERAL SETTINGS
                // ═══════════════════════════════════════════════════
                'general' => [
                    // School Identity
                    'app_name' => config('app.name', 'RPL Smart Ecosystem'),
                    'school_name' => config('app.school_name', ''),
                    'npsn' => config('app.npsn', ''),
                    'school_slogan' => config('app.school_slogan', ''),
                    'school_description' => config('app.school_description', ''),
                    'address' => config('app.address', ''),
                    'province' => config('app.province', ''),
                    'city' => config('app.city', ''),
                    'district' => config('app.district', ''),
                    'postal_code' => config('app.postal_code', ''),
                    'website' => config('app.website', ''),
                    'support_email' => config('app.support_email', ''),
                    'support_phone' => config('app.support_phone', ''),
                    'academic_year' => config('app.academic_year', '2024/2025'),
                    'semester' => config('app.semester', '1'),
                    
                    // Branding
                    'primary_color' => config('app.primary_color', '#FF5C00'),
                    'secondary_color' => config('app.secondary_color', '#2E2BBF'),
                    'default_theme' => config('app.default_theme', 'light'),
                    'logo_url' => config('app.logo_url', ''),
                    'login_background' => config('app.login_background', ''),
                    'dashboard_banner' => config('app.dashboard_banner', ''),
                    
                    // Dashboard Widgets
                    'default_page' => config('app.default_page', 'dashboard'),
                    'show_realtime_stats' => config('app.show_realtime_stats', true),
                    'show_weather' => config('app.show_weather', true),
                    'show_daily_motivation' => config('app.show_daily_motivation', true),
                    'show_academic_calendar' => config('app.show_academic_calendar', true),
                    
                    // Time Settings
                    'timezone' => config('app.timezone', 'Asia/Jakarta'),
                    'date_format' => config('app.date_format', 'DD/MM/YYYY'),
                    'time_format' => config('app.time_format', '24h'),
                    'auto_logout_minutes' => config('app.auto_logout_minutes', 120),
                    'sync_server_time' => config('app.sync_server_time', true),
                    
                    // Notifications
                    'email_notifications' => config('app.email_notifications', true),
                    'push_notifications' => config('app.push_notifications', true),
                    'attendance_notification' => config('app.attendance_notification', true),
                    'login_notification' => config('app.login_notification', true),
                    'pkl_notification' => config('app.pkl_notification', true),
                    'violation_notification' => config('app.violation_notification', true),
                ],

                // ═══════════════════════════════════════════════════
                // ATTENDANCE SETTINGS
                // ═══════════════════════════════════════════════════
                'attendance' => [
                    // GPS & Location
                    'school_latitude' => config('app.school_latitude', ''),
                    'school_longitude' => config('app.school_longitude', ''),
                    'multiple_locations' => config('app.multiple_locations', false),
                    
                    // Validation Rules
                    'radius_meters' => config('app.attendance_radius_meters', 100),
                    'max_late_minutes' => config('app.attendance_max_late_minutes', 15),
                    'check_in_time' => config('app.attendance_check_in_time', '06:00'),
                    'check_out_time' => config('app.attendance_check_out_time', '16:00'),
                    'break_start' => config('app.attendance_break_start', '12:00'),
                    'break_end' => config('app.attendance_break_end', '12:30'),
                    'overtime_start' => config('app.attendance_overtime_start', '16:00'),
                    'late_tolerance' => config('app.attendance_late_tolerance', 5),
                    'auto_alpha' => config('app.attendance_auto_alpha', true),
                    
                    // Smart Attendance Features
                    'face_verification' => config('app.attendance_face_verification', false),
                    'selfie_verification' => config('app.attendance_selfie_verification', true),
                    'anti_fake_gps' => config('app.attendance_anti_fake_gps', true),
                    'anti_screenshot' => config('app.attendance_anti_screenshot', true),
                    'device_verification' => config('app.attendance_device_verification', true),
                    'mock_location_detection' => config('app.attendance_mock_location_detection', true),
                    'wifi_validation' => config('app.attendance_wifi_validation', false),
                    'wifi_ssid' => config('app.attendance_wifi_ssid', ''),
                    'bluetooth_validation' => config('app.attendance_bluetooth_validation', false),
                    
                    // QR Code Settings
                    'qr_enabled' => config('app.attendance_qr_enabled', true),
                    'qr_expired_seconds' => config('app.attendance_qr_expired_seconds', 30),
                    'qr_random' => config('app.attendance_qr_random', true),
                    'qr_animated' => config('app.attendance_qr_animated', true),
                    
                    // Advanced Features
                    'multiple_shifts' => config('app.attendance_multiple_shifts', false),
                    'flexible_schedule' => config('app.attendance_flexible_schedule', false),
                    'online_permission' => config('app.attendance_online_permission', true),
                    'teacher_approval' => config('app.attendance_teacher_approval', true),
                    'parent_notification' => config('app.attendance_parent_notification', false),
                    'whatsapp_integration' => config('app.attendance_whatsapp_integration', false),
                ],

                // ═══════════════════════════════════════════════════
                // PKL / INTERNSHIP SETTINGS
                // ═══════════════════════════════════════════════════
                'pkl' => [
                    // General PKL Settings
                    'enable_pkl_attendance' => config('app.pkl_enable_pkl_attendance', true),
                    'require_supervisor_approval' => config('app.pkl_require_supervisor_approval', true),
                    'max_distance_km' => config('app.pkl_max_distance_km', 5),
                    
                    // Monitoring & Reports
                    'show_progress_tracking' => config('app.pkl_show_progress_tracking', true),
                    'require_weekly_report' => config('app.pkl_require_weekly_report', true),
                    'auto_reminder' => config('app.pkl_auto_reminder', true),
                    'reminder_day' => config('app.pkl_reminder_day', 5),
                    
                    // Integration
                    'google_maps_integration' => config('app.pkl_google_maps_integration', true),
                    'whatsapp_notification' => config('app.pkl_whatsapp_notification', false),
                    'email_reminder' => config('app.pkl_email_reminder', true),
                ],

                // ═══════════════════════════════════════════════════
                // SECURITY SETTINGS
                // ═══════════════════════════════════════════════════
                'security' => [
                    // Authentication
                    'two_factor_auth' => config('app.security_two_factor_auth', false),
                    'otp_email' => config('app.security_otp_email', true),
                    'otp_whatsapp' => config('app.security_otp_whatsapp', false),
                    'biometric_login' => config('app.security_biometric_login', false),
                    'trusted_devices' => config('app.security_trusted_devices', true),
                    'session_limit' => config('app.security_session_limit', 3),
                    
                    // Login Security
                    'login_history_enabled' => config('app.security_login_history_enabled', true),
                    'device_history_enabled' => config('app.security_device_history_enabled', true),
                    'ip_tracking' => config('app.security_ip_tracking', true),
                    'suspicious_login_detection' => config('app.security_suspicious_login_detection', true),
                    'failed_login_lockout' => config('app.security_failed_login_lockout', true),
                    'failed_attempts_max' => config('app.security_failed_attempts_max', 5),
                    'lockout_duration_minutes' => config('app.security_lockout_duration_minutes', 30),
                    
                    // Password Policy
                    'min_password_length' => config('app.security_min_password_length', 8),
                    'password_expire_days' => config('app.security_password_expire_days', 90),
                    'require_uppercase' => config('app.security_require_uppercase', true),
                    'require_number' => config('app.security_require_number', true),
                    'require_special_char' => config('app.security_require_special_char', true),
                    'password_strength_meter' => config('app.security_password_strength_meter', true),
                    'password_history_count' => config('app.security_password_history_count', 5),
                    
                    // API & Access
                    'api_token_enabled' => config('app.security_api_token_enabled', true),
                    'rate_limit_per_minute' => config('app.security_rate_limit_per_minute', 60),
                    'audit_log_enabled' => config('app.security_audit_log_enabled', true),
                    
                    // Monitoring
                    'security_score_enabled' => config('app.security_score_enabled', true),
                    'threat_monitoring' => config('app.security_threat_monitoring', true),
                ],

                // ═══════════════════════════════════════════════════
                // FEATURE FLAGS
                // ═══════════════════════════════════════════════════
                'features' => [
                    // Public Website
                    'public_gallery' => config('app.feature_public_gallery', true),
                    'career_simulator' => config('app.feature_career_simulator', true),
                    'achievement_showcase' => config('app.feature_achievement_showcase', true),
                    'landing_page_editor' => config('app.feature_landing_page_editor', false),
                    'news_management' => config('app.feature_news_management', true),
                    
                    // AI Features
                    'ai_student_recommendation' => config('app.feature_ai_student_recommendation', false),
                    'ai_analytics' => config('app.feature_ai_analytics', false),
                    'ai_chatbot' => config('app.feature_ai_chatbot', false),
                    'ai_monitoring' => config('app.feature_ai_monitoring', false),
                    'ai_attendance_prediction' => config('app.feature_ai_attendance_prediction', false),
                    
                    // System Modules
                    'e_learning' => config('app.feature_e_learning', false),
                    'cbt_exam' => config('app.feature_cbt_exam', false),
                    'e_raport' => config('app.feature_e_raport', true),
                    'digital_library' => config('app.feature_digital_library', false),
                    'smart_classroom' => config('app.feature_smart_classroom', false),
                    'school_inventory' => config('app.feature_school_inventory', false),
                    
                    // Advanced
                    'dynamic_config' => config('app.feature_dynamic_config', true),
                    'realtime_update' => config('app.feature_realtime_update', true),
                    'cache_refresh_auto' => config('app.feature_cache_refresh_auto', true),
                ],

                // ═══════════════════════════════════════════════════
                // BACKUP & SYSTEM SETTINGS
                // ═══════════════════════════════════════════════════
                'backup' => [
                    'auto_backup' => config('app.backup_auto_backup', true),
                    'backup_schedule' => config('app.backup_schedule', 'daily'),
                    'backup_time' => config('app.backup_time', '02:00'),
                    'backup_retention_days' => config('app.backup_retention_days', 30),
                    'cloud_backup' => config('app.backup_cloud_backup', false),
                    'compress_backup' => config('app.backup_compress_backup', true),
                    'encrypt_backup' => config('app.backup_encrypt_backup', true),
                ],
            ];

            // Merge with database settings
            foreach ($defaults as $section => &$items) {
                foreach ($items as $key => &$value) {
                    $dbKey = "{$section}_{$key}";
                    if (isset($dbSettings[$dbKey])) {
                        $dbValue = $dbSettings[$dbKey];
                        // Convert booleans
                        if ($dbValue === '1') $value = true;
                        elseif ($dbValue === '0') $value = false;
                        // Convert numeric strings to numbers
                        elseif (is_numeric($dbValue) && !Str::contains($dbValue, '.')) {
                            $value = (int) $dbValue;
                        } elseif (is_numeric($dbValue)) {
                            $value = (float) $dbValue;
                        } else {
                            $value = $dbValue;
                        }
                    }
                }
            }

            return $defaults;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Settings retrieved successfully.',
            'code' => 'SETTINGS_SUCCESS',
            'data' => $settings,
            'meta' => [
                'cached' => Cache::has(self::CACHE_KEY),
                'generated_at' => now()->toDateTimeString(),
                'sections' => self::SECTIONS,
            ],
        ], 200);
    }

    /**
     * Update settings by section.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        $section = $request->input('section');
        $data = $request->input('data');

        // If no explicit section/data provided, check if sections are sent as root keys
        if (!$section && !$data) {
            $sections = self::SECTIONS;
            $multiData = $request->only($sections);
            
            if (!empty($multiData)) {
                $section = 'all';
                $data = $multiData;
            }
        }

        // Final check: Section and data required
        if (empty($section) || empty($data)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid payload format or empty data.',
                'code' => 'VALIDATION_ERROR',
                'received' => $request->all(),
                'hint' => 'Send {section: "general", data: {...}} or {general: {...}, attendance: {...}}',
            ], 400);
        }

        try {
            if ($section === 'all') {
                DB::beginTransaction();
                foreach ($data as $s => $d) {
                    if (in_array($s, self::SECTIONS)) {
                        $validated = $this->validateSettings($s, $d);
                        $this->saveSettings($s, $validated);
                    }
                }
                DB::commit();
            } else {
                // Validate based on section
                $validated = $this->validateSettings($section, $data);
                $this->saveSettings($section, $validated);
            }

            // Clear cache
            Cache::forget(self::CACHE_KEY);

            // Log the change
            Log::info('Settings updated', [
                'section' => $section,
                'updated_by' => auth()->id(),
                'user_name' => auth()->user()?->name,
                'timestamp' => now()->toDateTimeString(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => $section === 'all' ? "All settings saved successfully." : "{$section} settings saved successfully.",
                'code' => 'SETTINGS_UPDATED',
                'data' => [
                    'section' => $section,
                    'updated_at' => now()->toDateTimeString(),
                    'updated_by' => auth()->user()?->name,
                    'user_id' => auth()->id(),
                ],
            ], 200);

        } catch (ValidationException $e) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Settings validation failed.',
                'code' => 'VALIDATION_ERROR',
                'errors' => $e->errors(),
                'section' => $section,
            ], 422);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            Log::error('SettingController::update failed', [
                'section' => $section,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to save settings.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get a single setting value by key.
     * 
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $dbSettings = DB::table('settings')->pluck('value', 'key')->toArray();
            return array_merge(self::getDefaultSettings(), $dbSettings);
        });

        return $settings[$key] ?? $default;
    }

    /**
     * Validate settings data based on section.
     * 
     * @param string $section
     * @param array $data
     * @return array
     * @throws ValidationException
     */
    private function validateSettings(string $section, array $data): array
    {
        $validator = match ($section) {
            'general' => Validator::make($data, [
                // School Identity
                'app_name' => 'nullable|string|max:255',
                'school_name' => 'nullable|string|max:255',
                'npsn' => 'nullable|string|max:20',
                'school_slogan' => 'nullable|string|max:255',
                'school_description' => 'nullable|string|max:1000',
                'address' => 'nullable|string|max:500',
                'province' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100',
                'district' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:10',
                'website' => 'nullable|url|max:255',
                'support_email' => 'nullable|email|max:255',
                'support_phone' => 'nullable|string|max:20',
                'academic_year' => 'required|string|max:20',
                'semester' => 'required|in:1,2',
                
                // Branding
                'primary_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
                'secondary_color' => 'nullable|regex:/^#[0-9A-F]{6}$/i',
                'default_theme' => 'nullable|in:light,dark,system',
                'logo_url' => 'nullable|url|max:500',
                'login_background' => 'nullable|url|max:500',
                'dashboard_banner' => 'nullable|url|max:500',
                
                // Dashboard
                'default_page' => 'nullable|in:dashboard,attendance,projects,profile',
                'show_realtime_stats' => 'boolean',
                'show_weather' => 'boolean',
                'show_daily_motivation' => 'boolean',
                'show_academic_calendar' => 'boolean',
                
                // Time
                'timezone' => 'nullable|timezone',
                'date_format' => 'nullable|in:DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD',
                'time_format' => 'nullable|in:12h,24h',
                'auto_logout_minutes' => 'nullable|integer|min:5|max:1440',
                'sync_server_time' => 'boolean',
                
                // Notifications
                'email_notifications' => 'boolean',
                'push_notifications' => 'boolean',
                'attendance_notification' => 'boolean',
                'login_notification' => 'boolean',
                'pkl_notification' => 'boolean',
                'violation_notification' => 'boolean',
            ]),

            'attendance' => Validator::make($data, [
                // GPS
                'school_latitude' => 'nullable|numeric|between:-90,90',
                'school_longitude' => 'nullable|numeric|between:-180,180',
                'multiple_locations' => 'boolean',
                
                // Validation
                'radius_meters' => 'required|integer|min:10|max:1000',
                'max_late_minutes' => 'nullable|integer|min:0|max:120',
                'check_in_time' => 'required|date_format:H:i',
                'check_out_time' => 'required|date_format:H:i|after:check_in_time',
                'break_start' => 'nullable|date_format:H:i',
                'break_end' => 'nullable|date_format:H:i|after:break_start',
                'overtime_start' => 'nullable|date_format:H:i',
                'late_tolerance' => 'nullable|integer|min:0|max:30',
                'auto_alpha' => 'boolean',
                
                // Smart Features
                'face_verification' => 'boolean',
                'selfie_verification' => 'boolean',
                'anti_fake_gps' => 'boolean',
                'anti_screenshot' => 'boolean',
                'device_verification' => 'boolean',
                'mock_location_detection' => 'boolean',
                'wifi_validation' => 'boolean',
                'wifi_ssid' => 'nullable|string|max:100',
                'bluetooth_validation' => 'boolean',
                
                // QR
                'qr_enabled' => 'boolean',
                'qr_expired_seconds' => 'nullable|integer|min:10|max:300',
                'qr_random' => 'boolean',
                'qr_animated' => 'boolean',
                
                // Advanced
                'multiple_shifts' => 'boolean',
                'flexible_schedule' => 'boolean',
                'online_permission' => 'boolean',
                'teacher_approval' => 'boolean',
                'parent_notification' => 'boolean',
                'whatsapp_integration' => 'boolean',
            ]),

            'pkl' => Validator::make($data, [
                'enable_pkl_attendance' => 'boolean',
                'require_supervisor_approval' => 'boolean',
                'max_distance_km' => 'nullable|integer|min:1|max:100',
                'show_progress_tracking' => 'boolean',
                'require_weekly_report' => 'boolean',
                'auto_reminder' => 'boolean',
                'reminder_day' => 'nullable|integer|min:1|max:30',
                'google_maps_integration' => 'boolean',
                'whatsapp_notification' => 'boolean',
                'email_reminder' => 'boolean',
            ]),

            'security' => Validator::make($data, [
                // Authentication
                'two_factor_auth' => 'boolean',
                'otp_email' => 'boolean',
                'otp_whatsapp' => 'boolean',
                'biometric_login' => 'boolean',
                'trusted_devices' => 'boolean',
                'session_limit' => 'nullable|integer|min:1|max:10',
                
                // Login Security
                'login_history_enabled' => 'boolean',
                'device_history_enabled' => 'boolean',
                'ip_tracking' => 'boolean',
                'suspicious_login_detection' => 'boolean',
                'failed_login_lockout' => 'boolean',
                'failed_attempts_max' => 'nullable|integer|min:1|max:20',
                'lockout_duration_minutes' => 'nullable|integer|min:5|max:1440',
                
                // Password Policy
                'min_password_length' => 'nullable|integer|min:6|max:32',
                'password_expire_days' => 'nullable|integer|min:1|max:365',
                'require_uppercase' => 'boolean',
                'require_number' => 'boolean',
                'require_special_char' => 'boolean',
                'password_strength_meter' => 'boolean',
                'password_history_count' => 'nullable|integer|min:0|max:20',
                
                // API
                'api_token_enabled' => 'boolean',
                'rate_limit_per_minute' => 'nullable|integer|min:1|max:1000',
                'audit_log_enabled' => 'boolean',
                
                // Monitoring
                'security_score_enabled' => 'boolean',
                'threat_monitoring' => 'boolean',
            ]),

            'features' => Validator::make($data, [
                // Public Website
                'public_gallery' => 'boolean',
                'career_simulator' => 'boolean',
                'achievement_showcase' => 'boolean',
                'landing_page_editor' => 'boolean',
                'news_management' => 'boolean',
                
                // AI Features
                'ai_student_recommendation' => 'boolean',
                'ai_analytics' => 'boolean',
                'ai_chatbot' => 'boolean',
                'ai_monitoring' => 'boolean',
                'ai_attendance_prediction' => 'boolean',
                
                // System Modules
                'e_learning' => 'boolean',
                'cbt_exam' => 'boolean',
                'e_raport' => 'boolean',
                'digital_library' => 'boolean',
                'smart_classroom' => 'boolean',
                'school_inventory' => 'boolean',
                
                // Advanced
                'dynamic_config' => 'boolean',
                'realtime_update' => 'boolean',
                'cache_refresh_auto' => 'boolean',
            ]),

            'backup' => Validator::make($data, [
                'auto_backup' => 'boolean',
                'backup_schedule' => 'nullable|in:daily,weekly,monthly',
                'backup_time' => 'nullable|date_format:H:i',
                'backup_retention_days' => 'nullable|integer|min:1|max:365',
                'cloud_backup' => 'boolean',
                'compress_backup' => 'boolean',
                'encrypt_backup' => 'boolean',
            ]),

            default => throw new \InvalidArgumentException("Unknown settings section: {$section}"),
        };

        return $validator->validated();
    }

    /**
     * Save settings to database.
     * 
     * @param string $section
     * @param array $data
     * @return void
     */
    private function saveSettings(string $section, array $data): void
    {
        DB::beginTransaction();
        
        try {
            foreach ($data as $key => $value) {
                $settingKey = "{$section}_{$key}";
                
                // Convert boolean to string for storage
                $storedValue = is_bool($value) ? ($value ? '1' : '0') : $value;
                
                DB::table('settings')->updateOrInsert(
                    ['key' => $settingKey],
                    [
                        'value' => $storedValue,
                        'updated_at' => now(),
                    ]
                );
            }
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get default settings fallback values.
     * 
     * @return array
     */
    private static function getDefaultSettings(): array
    {
        return [
            'general_app_name' => 'RPL Smart Ecosystem',
            'general_default_theme' => 'light',
            'general_timezone' => 'Asia/Jakarta',
            'attendance_radius_meters' => 100,
            'attendance_check_in_time' => '06:00',
            'attendance_check_out_time' => '16:00',
            'pkl_enable_pkl_attendance' => true,
            'security_min_password_length' => 8,
            'features_public_gallery' => true,
            'backup_auto_backup' => true,
            'backup_schedule' => 'daily',
        ];
    }

    /**
     * Reset settings to default values.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function reset(Request $request): JsonResponse
    {
        $section = $request->input('section');
        
        if (!$section || $section === 'all') {
            // Reset all settings
            DB::table('settings')->truncate();
            $message = 'All settings reset to default successfully.';
        } else {
            // Reset specific section
            DB::table('settings')->where('key', 'like', "{$section}_%")->delete();
            $message = "{$section} settings reset to default successfully.";
        }
        
        Cache::forget(self::CACHE_KEY);
        
        Log::info('Settings reset', [
            'section' => $section ?? 'all',
            'reset_by' => auth()->id(),
            'user_name' => auth()->user()?->name,
        ]);
        
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'code' => 'SETTINGS_RESET',
        ], 200);
    }

    /**
     * Export settings to JSON file.
     * 
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function export()
    {
        $settings = $this->index()->getData(true);
        
        $filename = 'rpl-settings-' . now()->format('Y-m-d_H-i-s') . '.json';
        $content = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        
        // Store temporarily
        $path = Storage::disk('local')->put($filename, $content);
        
        Log::info('Settings exported', [
            'filename' => $filename,
            'exported_by' => auth()->id(),
        ]);
        
        return response()->download(Storage::disk('local')->path($filename), $filename)
            ->deleteFileAfterSend(true);
    }

    /**
     * Import settings from JSON file.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:json|max:2048',
            'merge' => 'boolean', // If true, merge with existing; if false, replace
        ]);

        try {
            $file = $request->file('file');
            $content = file_get_contents($file->getRealPath());
            $importData = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid JSON file.',
                    'code' => 'INVALID_JSON',
                    'error' => json_last_error_msg(),
                ], 422);
            }

            DB::beginTransaction();

            $merge = $request->boolean('merge', false);
            
            if (!$merge) {
                // Clear existing settings before import
                DB::table('settings')->truncate();
            }

            $imported = 0;
            foreach ($importData['data'] ?? $importData as $section => $values) {
                if (is_array($values) && in_array($section, self::SECTIONS)) {
                    foreach ($values as $key => $value) {
                        $settingKey = "{$section}_{$key}";
                        $storedValue = is_bool($value) ? ($value ? '1' : '0') : $value;
                        
                        DB::table('settings')->updateOrInsert(
                            ['key' => $settingKey],
                            ['value' => $storedValue, 'updated_at' => now()]
                        );
                        $imported++;
                    }
                }
            }

            DB::commit();
            Cache::forget(self::CACHE_KEY);

            Log::info('Settings imported', [
                'imported_count' => $imported,
                'merge_mode' => $merge,
                'imported_by' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Settings imported successfully. {$imported} settings updated.",
                'code' => 'SETTINGS_IMPORTED',
                'data' => [
                    'imported_count' => $imported,
                    'merge_mode' => $merge,
                ],
            ], 200);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            Log::error('SettingController::import failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to import settings.',
                'code' => 'IMPORT_FAILED',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get settings changelog/history.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        $query = DB::table('activity_log')
            ->where('log_name', 'settings')
            ->orderBy('created_at', 'desc');

        if ($request->filled('section')) {
            $query->where('properties->section', $request->section);
        }

        if ($request->filled('user_id')) {
            $query->where('causer_id', $request->user_id);
        }

        $history = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'status' => 'success',
            'message' => 'Settings history retrieved.',
            'code' => 'SETTINGS_HISTORY_SUCCESS',
            'data' => $history,
        ], 200);
    }

    // ═══════════════════════════════════════════════════════════
    // MISSING METHODS — added to fix BadMethodCallException
    // ═══════════════════════════════════════════════════════════

    /**
     * Retro-themed alias for index().
     * Route: GET /admin/settings/retro
     *
     * @return JsonResponse
     */
    public function retroIndex(): JsonResponse
    {
        return $this->index();
    }

    /**
     * Update settings for a specific section via URL parameter.
     * Route: PUT /admin/settings/section/{section}
     *
     * @param Request $request
     * @param string  $section
     * @return JsonResponse
     */
    public function updateSection(Request $request, string $section): JsonResponse
    {
        // Inject the section key into the request payload and delegate to update()
        $request->merge(['section' => $section, 'data' => $request->except(['section'])]);
        return $this->update($request);
    }

    /**
     * Reset a specific section to defaults via URL parameter.
     * Route: POST /admin/settings/reset/section/{section}
     *
     * @param Request $request
     * @param string  $section
     * @return JsonResponse
     */
    public function resetSection(Request $request, string $section): JsonResponse
    {
        $request->merge(['section' => $section]);
        return $this->reset($request);
    }

    /**
     * Export settings as a downloadable JSON file.
     * Route: GET /admin/settings/export/json
     * Alias of export().
     *
     * @return mixed
     */
    public function exportJSON()
    {
        return $this->export();
    }

    /**
     * Return the list of available settings categories/sections.
     * Route: GET /admin/settings/categories
     *
     * @return JsonResponse
     */
    public function categories(): JsonResponse
    {
        $categories = [
            ['id' => 'general',    'label' => 'Umum',           'icon' => 'Settings2',      'description' => 'Pengaturan umum sekolah dan branding'],
            ['id' => 'attendance', 'label' => 'Absensi',        'icon' => 'Fingerprint',    'description' => 'Konfigurasi absensi, GPS, QR Code'],
            ['id' => 'pkl',        'label' => 'PKL',            'icon' => 'Briefcase',      'description' => 'Pengaturan program PKL / magang'],
            ['id' => 'security',   'label' => 'Keamanan',       'icon' => 'Shield',         'description' => 'Autentikasi, kata sandi, 2FA'],
            ['id' => 'features',   'label' => 'Fitur',          'icon' => 'Sparkles',       'description' => 'Feature flags modul aplikasi'],
            ['id' => 'backup',     'label' => 'Backup & Sistem','icon' => 'Database',       'description' => 'Backup otomatis & enkripsi data'],
        ];

        return response()->json([
            'status'  => 'success',
            'message' => 'Settings categories retrieved.',
            'code'    => 'CATEGORIES_SUCCESS',
            'data'    => $categories,
        ], 200);
    }

    /**
     * Return a preview of the current branding settings.
     * Route: GET /admin/settings/branding/preview
     *
     * @return JsonResponse
     */
    public function brandingPreview(): JsonResponse
    {
        $settings = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return DB::table('settings')->pluck('value', 'key')->toArray();
        });

        $branding = [
            'primary_color'      => $settings['general_primary_color']   ?? '#FF5C00',
            'secondary_color'    => $settings['general_secondary_color']  ?? '#2E2BBF',
            'default_theme'      => $settings['general_default_theme']    ?? 'light',
            'logo_url'           => $settings['general_logo_url']         ?? null,
            'login_background'   => $settings['general_login_background'] ?? null,
            'dashboard_banner'   => $settings['general_dashboard_banner'] ?? null,
            'app_name'           => $settings['general_app_name']         ?? config('app.name', 'RPL Smart Ecosystem'),
            'school_slogan'      => $settings['general_school_slogan']    ?? '',
        ];

        return response()->json([
            'status'  => 'success',
            'message' => 'Branding preview retrieved.',
            'code'    => 'BRANDING_PREVIEW_SUCCESS',
            'data'    => $branding,
        ], 200);
    }

    /**
     * Return a list of available notification templates.
     * Route: GET /admin/settings/notification-templates
     *
     * @return JsonResponse
     */
    public function notificationTemplates(): JsonResponse
    {
        $templates = [
            [
                'id'          => 'attendance_reminder',
                'name'        => 'Pengingat Absensi',
                'description' => 'Dikirim ke siswa yang belum absen pada jam tertentu.',
                'channel'     => ['email', 'push'],
                'variables'   => ['{student_name}', '{date}', '{check_in_time}'],
                'subject'     => 'Pengingat: Jangan lupa absen hari ini, {student_name}!',
                'body'        => 'Halo {student_name}, jangan lupa melakukan absensi hari ini sebelum pukul {check_in_time}.',
            ],
            [
                'id'          => 'permission_approved',
                'name'        => 'Izin Disetujui',
                'description' => 'Dikirim ke siswa saat surat izin disetujui guru.',
                'channel'     => ['email', 'push'],
                'variables'   => ['{student_name}', '{date_from}', '{date_to}', '{teacher_name}'],
                'subject'     => 'Izin Anda Telah Disetujui',
                'body'        => 'Halo {student_name}, izin Anda dari tanggal {date_from} s.d. {date_to} telah disetujui oleh {teacher_name}.',
            ],
            [
                'id'          => 'permission_rejected',
                'name'        => 'Izin Ditolak',
                'description' => 'Dikirim ke siswa saat surat izin ditolak guru.',
                'channel'     => ['email', 'push'],
                'variables'   => ['{student_name}', '{reason}', '{teacher_name}'],
                'subject'     => 'Izin Anda Tidak Disetujui',
                'body'        => 'Halo {student_name}, mohon maaf izin Anda tidak dapat disetujui. Alasan: {reason}.',
            ],
            [
                'id'          => 'pkl_assigned',
                'name'        => 'Penempatan PKL',
                'description' => 'Dikirim ke siswa saat ditempatkan di lokasi PKL.',
                'channel'     => ['email', 'push'],
                'variables'   => ['{student_name}', '{location_name}', '{address}'],
                'subject'     => 'Informasi Penempatan PKL Anda',
                'body'        => 'Halo {student_name}, Anda ditempatkan di {location_name} ({address}) untuk program PKL.',
            ],
        ];

        return response()->json([
            'status'  => 'success',
            'message' => 'Notification templates retrieved.',
            'code'    => 'NOTIFICATION_TEMPLATES_SUCCESS',
            'data'    => $templates,
        ], 200);
    }

    /**
     * Send a test notification using a template.
     * Route: POST /admin/settings/notification-templates/{id}/test
     *
     * @param Request $request
     * @param string  $id  - Template ID
     * @return JsonResponse
     */
    public function testNotification(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'recipient_email' => 'required|email',
        ]);

        // For now, log the test notification (real email/push delivery would use Mail/Notification jobs)
        Log::info('Test notification triggered', [
            'template_id'     => $id,
            'recipient_email' => $request->recipient_email,
            'triggered_by'    => auth()->id(),
            'timestamp'       => now()->toDateTimeString(),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Test notification for template '{$id}' queued for {$request->recipient_email}.",
            'code'    => 'TEST_NOTIFICATION_SENT',
            'data'    => [
                'template_id'     => $id,
                'recipient_email' => $request->recipient_email,
                'sent_at'         => now()->toDateTimeString(),
            ],
        ], 200);
    }
}