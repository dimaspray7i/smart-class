<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Public\LandingController;
use App\Http\Controllers\Public\StudentGalleryController;
use App\Http\Controllers\Public\SimulatorController;
use App\Http\Controllers\Student\DashboardController as StudentDashboard;
use App\Http\Controllers\Student\AttendanceController as StudentAttendance;
use App\Http\Controllers\Student\ProjectController as StudentProject;
use App\Http\Controllers\Student\SkillController as StudentSkill;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboard;
use App\Http\Controllers\Teacher\AttendanceController as TeacherAttendance;
use App\Http\Controllers\Teacher\PermissionController as TeacherPermission;
use App\Http\Controllers\Admin\DashboardController as AdminDashboard;
use App\Http\Controllers\Admin\UserController as AdminUser;
use App\Http\Controllers\Admin\ClassController as AdminClass;
use App\Http\Controllers\Admin\SubjectController as AdminSubject;
use App\Http\Controllers\Admin\ScheduleController as AdminSchedule;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\PklLocationController;
use App\Http\Controllers\Admin\AnalyticsController;

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO FUTURISTIC API ROUTES
// RPL Smart Ecosystem v2.0 - Cyber Retro Edition
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// GLOBAL API MIDDLEWARE GROUP
// ═══════════════════════════════════════════════════════════
Route::middleware('api')->group(function () {

    // ═══════════════════════════════════════════════════════════
    // 🏥 HEALTH CHECK & SYSTEM STATUS (Public)
    // ═══════════════════════════════════════════════════════════
    Route::get('/health', function () {
        return response()->json([
            'status' => 'success',
            'message' => '🚀 RPL Smart Ecosystem API is running!',
            'version' => '2.0.0-retro',
            'timestamp' => now()->toDateTimeString(),
            'environment' => config('app.env'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'retro_mode' => true,
        ], 200);
    });

    Route::get('/status', function () {
        return response()->json([
            'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected',
            'cache' => Cache::driver() ? 'active' : 'inactive',
            'queue' => config('queue.default'),
            'storage' => Storage::disk('public')->exists('.') ? 'available' : 'unavailable',
            'redis' => extension_loaded('redis') ? 'enabled' : 'disabled',
            'memory_usage' => round(memory_get_usage(true) / 1024 / 1024, 2) . ' MB',
        ], 200);
    });

    // ═══════════════════════════════════════════════════════════
    // 🌐 PUBLIC ROUTES (No Authentication Required)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/public')->group(function () {
        
        // Landing Page - Retro Style
        Route::get('/landing', [LandingController::class, 'index']);
        Route::get('/landing/retro-assets', [LandingController::class, 'retroAssets']);
        Route::get('/stats', [LandingController::class, 'stats']);
        Route::get('/stats/animated', [LandingController::class, 'animatedStats']);
        
        // Student Gallery (Public) - Retro Grid View
        Route::get('/gallery', [StudentGalleryController::class, 'index']);
        Route::get('/gallery/grid', [StudentGalleryController::class, 'gridView']);
        Route::get('/gallery/{slug}', [StudentGalleryController::class, 'show']);
        Route::get('/gallery/{slug}/retro-preview', [StudentGalleryController::class, 'retroPreview']);
        
        // Career Path Simulator (Public) - Interactive Retro UI
        Route::prefix('simulator')->group(function () {
            Route::get('/paths', [SimulatorController::class, 'index']);
            Route::get('/paths/categories', [SimulatorController::class, 'categories']);
            Route::get('/paths/{slug}', [SimulatorController::class, 'show']);
            Route::get('/paths/{slug}/retro-flow', [SimulatorController::class, 'retroFlow']);
            Route::post('/sessions', [SimulatorController::class, 'startSession']);
            Route::post('/sessions/{id}/choice', [SimulatorController::class, 'submitChoice']);
            Route::get('/sessions/{id}/result', [SimulatorController::class, 'getResult']);
            Route::get('/sessions/{id}/retro-result', [SimulatorController::class, 'retroResult']);
            Route::post('/sessions/{id}/export', [SimulatorController::class, 'exportResult']);
        });

        // Public API Info - Retro Style
        Route::get('/info', function () {
            return response()->json([
                'api_name' => 'RPL Smart Ecosystem API',
                'version' => '2.0.0-retro',
                'theme' => 'Retro Futuristic',
                'documentation' => '/docs',
                'health' => '/health',
                'status' => '/status',
            ], 200);
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 🔐 AUTHENTICATION ROUTES
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/auth')->group(function () {
        
        // Public: Login with Retro Theme Support
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/login/retro', [AuthController::class, 'loginRetro']);
        
        // Password Reset Flow (Public)
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        
        // Protected: Auth operations with Retro Features
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::get('/me/retro-profile', [AuthController::class, 'retroProfile']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::put('/profile/retro', [AuthController::class, 'updateRetroProfile']);
            Route::post('/token/refresh', [AuthController::class, 'refreshToken']);
            Route::post('/token/retro-refresh', [AuthController::class, 'retroRefreshToken']);
            
            // Two-Factor Auth (Retro Style)
            Route::post('/2fa/enable', [AuthController::class, 'enable2FA']);
            Route::post('/2fa/disable', [AuthController::class, 'disable2FA']);
            Route::post('/2fa/verify', [AuthController::class, 'verify2FA']);
            
            // Device Management (Retro UI)
            Route::get('/devices', [AuthController::class, 'devices']);
            Route::delete('/devices/{id}', [AuthController::class, 'revokeDevice']);
        });
    });

    // ═══════════════════════════════════════════════════════════
    // 🎓 STUDENT ROUTES (Role: siswa)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/student')
        ->middleware(['auth:sanctum', 'role:siswa'])
        ->group(function () {
            
            // Dashboard - Retro Style
            Route::get('/dashboard', [StudentDashboard::class, 'index']);
            Route::get('/dashboard/retro', [StudentDashboard::class, 'retroDashboard']);
            Route::get('/dashboard/widgets', [StudentDashboard::class, 'widgets']);
            
            // Attendance - Retro Features
            Route::prefix('attendance')->group(function () {
                Route::post('/', [StudentAttendance::class, 'store']);
                Route::post('/retro', [StudentAttendance::class, 'retroStore']);
                Route::get('/history', [StudentAttendance::class, 'history']);
                Route::get('/history/export', [StudentAttendance::class, 'exportHistory']);
                Route::get('/stats', [StudentAttendance::class, 'stats']);
                Route::get('/stats/retro', [StudentAttendance::class, 'retroStats']);
                Route::get('/today', [StudentAttendance::class, 'todayStatus']);
                Route::get('/today/retro', [StudentAttendance::class, 'retroTodayStatus']);
                
                // PKL: Get approved locations for class 12 students - Retro View
                Route::get('/pkl-locations', [StudentAttendance::class, 'getPklLocations']);
                Route::get('/pkl-locations/retro', [StudentAttendance::class, 'retroPklLocations']);
                Route::get('/pkl-locations/map-preview', [StudentAttendance::class, 'mapPreview']);
                
                // QR Code for Attendance (Retro Animated)
                Route::get('/qr/generate', [StudentAttendance::class, 'generateQR']);
                Route::post('/qr/verify', [StudentAttendance::class, 'verifyQR']);
                
                // Selfie Verification (Retro Camera UI)
                Route::post('/selfie/verify', [StudentAttendance::class, 'verifySelfie']);
                Route::get('/selfie/history', [StudentAttendance::class, 'selfieHistory']);
            });
            
            // Projects (CRUD) - Retro Grid/List Views
            Route::apiResource('projects', StudentProject::class);
            Route::get('/projects/grid', [StudentProject::class, 'gridView']);
            Route::get('/projects/list', [StudentProject::class, 'listView']);
            Route::get('/projects/{project}/logs', [StudentProject::class, 'logs']);
            Route::post('/projects/{project}/logs', [StudentProject::class, 'storeLog']);
            Route::get('/projects/{project}/retro-preview', [StudentProject::class, 'retroPreview']);
            Route::post('/projects/{project}/export', [StudentProject::class, 'exportProject']);
            
            // Skills - Retro Progress Visualization
            Route::prefix('skills')->group(function () {
                Route::get('/', [StudentSkill::class, 'index']);
                Route::get('/retro', [StudentSkill::class, 'retroIndex']);
                Route::get('/progress', [StudentSkill::class, 'progress']);
                Route::get('/progress/animated', [StudentSkill::class, 'animatedProgress']);
                Route::post('/{skill}/activity', [StudentSkill::class, 'logActivity']);
                Route::get('/{skill}/retro-activity', [StudentSkill::class, 'retroActivity']);
                Route::get('/recommendations', [StudentSkill::class, 'recommendations']);
            });

            // Student Profile - Retro Style
            Route::get('/profile/retro', function () {
                return response()->json([
                    'status' => 'success',
                    'data' => auth()->user()->load(['profile', 'classes'])->toArray(),
                    'retro_badges' => [
                        ['name' => 'Early Adopter', 'icon' => '🚀', 'earned' => true],
                        ['name' => 'PKL Ready', 'icon' => '💼', 'earned' => auth()->user()->profile?->class_level === 'XII'],
                    ],
                ], 200);
            });
        });

    // ═══════════════════════════════════════════════════════════
    // 👨‍🏫 TEACHER ROUTES (Role: guru)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/teacher')
        ->middleware(['auth:sanctum', 'role:guru'])
        ->group(function () {
            
            // Dashboard - Retro Teacher View
            Route::get('/dashboard', [TeacherDashboard::class, 'index']);
            Route::get('/dashboard/retro', [TeacherDashboard::class, 'retroDashboard']);
            Route::get('/dashboard/classes', [TeacherDashboard::class, 'myClasses']);
            Route::get('/dashboard/subjects', [TeacherDashboard::class, 'mySubjects']);
            Route::get('/classes', [TeacherDashboard::class, 'myClasses']);
            Route::get('/subjects', [TeacherDashboard::class, 'mySubjects']);
            Route::get('/schedule/today', [TeacherDashboard::class, 'todaySchedule']);
            
            // Attendance Control - Retro Features
            Route::prefix('attendance')->group(function () {
                Route::get('/sessions', [TeacherAttendance::class, 'sessions']);
                Route::post('/generate/{schedule_id}', [TeacherAttendance::class, 'generateFromSchedule']);
                Route::post('/session/create', [TeacherAttendance::class, 'createSession']);
                Route::post('/session/retro-create', [TeacherAttendance::class, 'retroCreateSession']);
                Route::post('/session/{id}/generate-code', [TeacherAttendance::class, 'generateCode']);
                Route::post('/sessions', [TeacherAttendance::class, 'createSession']);
                Route::post('/sessions/{id}/generate-code', [TeacherAttendance::class, 'generateCode']);
                Route::post('/session/{id}/generate-retro-qr', [TeacherAttendance::class, 'generateRetroQR']);
                Route::post('/session/{id}/close', [TeacherAttendance::class, 'closeSession']);
                Route::get('/session/{id}/monitor', [TeacherAttendance::class, 'monitor']);
                Route::get('/session/{id}/monitor/retro', [TeacherAttendance::class, 'retroMonitor']);
                Route::get('/session/{id}/live-stats', [TeacherAttendance::class, 'liveStats']);
                Route::get('/history', [TeacherAttendance::class, 'history']);
                Route::get('/history/export', [TeacherAttendance::class, 'exportHistory']);
                Route::patch('/{id}/verify', [TeacherAttendance::class, 'manualVerify']);
                Route::patch('/{id}/retro-verify', [TeacherAttendance::class, 'retroManualVerify']);
                
                // Bulk Operations (Retro UI)
                Route::post('/bulk/verify', [TeacherAttendance::class, 'bulkVerify']);
                Route::post('/bulk/export', [TeacherAttendance::class, 'bulkExport']);
            });
            
            // Student Management - Retro Cards/Grid
            Route::get('/students', [TeacherAttendance::class, 'students']);
            Route::get('/students/grid', [TeacherAttendance::class, 'studentsGrid']);
            Route::get('/students/{id}/attendance', [TeacherAttendance::class, 'studentAttendance']);
            Route::get('/students/{id}/retro-profile', [TeacherAttendance::class, 'retroStudentProfile']);
            Route::get('/students/{id}/attendance/export', [TeacherAttendance::class, 'exportStudentAttendance']);
            
            // Permissions - Retro Approval Flow
            Route::prefix('permissions')->group(function () {
                Route::get('/', [TeacherPermission::class, 'index']);
                Route::get('/retro', [TeacherPermission::class, 'retroIndex']);
                Route::post('/', [TeacherPermission::class, 'store']);
                Route::patch('/{id}/approve', [TeacherPermission::class, 'approve']);
                Route::patch('/{id}/reject', [TeacherPermission::class, 'reject']);
                Route::patch('/{id}/retro-approve', [TeacherPermission::class, 'retroApprove']);
                Route::get('/history', [TeacherPermission::class, 'history']);
                Route::get('/history/export', [TeacherPermission::class, 'exportHistory']);
                
                // Bulk Permission Actions
                Route::post('/bulk/approve', [TeacherPermission::class, 'bulkApprove']);
                Route::post('/bulk/reject', [TeacherPermission::class, 'bulkReject']);
            });

            // Teacher Analytics - Retro Charts
            Route::prefix('analytics')->group(function () {
                Route::get('/attendance', [TeacherAttendance::class, 'analytics']);
                Route::get('/attendance/retro', [TeacherAttendance::class, 'retroAnalytics']);
                Route::get('/students/progress', [TeacherAttendance::class, 'studentProgress']);
                Route::get('/export/summary', [TeacherAttendance::class, 'exportSummary']);
            });
        });

    // ═══════════════════════════════════════════════════════════
    // 🛡️ ADMIN ROUTES (Role: admin) - FULL ACCESS
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/admin')
        ->middleware(['auth:sanctum', 'role:admin'])
        ->group(function () {
            
            // Dashboard & Analytics - Retro Enhanced
            Route::get('/dashboard', [AdminDashboard::class, 'index']);
            Route::get('/dashboard/retro', [AdminDashboard::class, 'retroDashboard']);
            Route::get('/analytics/attendance', [AdminDashboard::class, 'attendanceAnalytics']);
            Route::get('/analytics/attendance/retro', [AdminDashboard::class, 'retroAttendanceAnalytics']);
            Route::get('/analytics/students', [AdminDashboard::class, 'studentAnalytics']);
            Route::get('/analytics/students/retro', [AdminDashboard::class, 'retroStudentAnalytics']);
            Route::get('/analytics/export', [AdminDashboard::class, 'exportAnalytics']);
            
            // ═══════════════════════════════════════════════════
            // 👥 USER MANAGEMENT - RETRO STYLE
            // ═══════════════════════════════════════════════════
            Route::apiResource('users', AdminUser::class);
            Route::get('/users/export', [AdminUser::class, 'export']);
            Route::get('/users/export/csv', [AdminUser::class, 'exportCSV']);
            Route::get('/users/export/json', [AdminUser::class, 'exportJSON']);
            Route::post('/users/{user}/reset-password', [AdminUser::class, 'resetPassword']);
            Route::patch('/users/{user}/role', [AdminUser::class, 'updateRole']);
            Route::patch('/users/{user}/retro-profile', [AdminUser::class, 'updateRetroProfile']);
            Route::get('/users/bulk/actions', [AdminUser::class, 'bulkActions']);
            Route::post('/users/bulk/update', [AdminUser::class, 'bulkUpdate']);
            Route::post('/users/bulk/delete', [AdminUser::class, 'bulkDelete']);
            Route::post('/users/bulk/export', [AdminUser::class, 'bulkExport']);
            
            // User Analytics (Retro Charts)
            Route::get('/users/analytics', [AdminUser::class, 'analytics']);
            Route::get('/users/analytics/retro', [AdminUser::class, 'retroAnalytics']);
            
            // ═══════════════════════════════════════════════════
            // 🏫 CLASS MANAGEMENT - RETRO STYLE
            // ═══════════════════════════════════════════════════
            Route::apiResource('classes', AdminClass::class);
            Route::get('/classes/export', [AdminClass::class, 'export']);
            Route::get('/classes/export/csv', [AdminClass::class, 'exportCSV']);
            Route::get('/classes/export/json', [AdminClass::class, 'exportJSON']);
            Route::get('/classes/grid', [AdminClass::class, 'gridView']);
            Route::get('/classes/list', [AdminClass::class, 'listView']);
            Route::get('/classes/{class}/retro-preview', [AdminClass::class, 'retroPreview']);
            Route::post('/classes/bulk/delete', [AdminClass::class, 'bulkDelete']);
            Route::post('/classes/bulk/export', [AdminClass::class, 'bulkExport']);
            
            // Class Analytics
            Route::get('/classes/analytics', [AdminClass::class, 'analytics']);
            Route::get('/classes/analytics/retro', [AdminClass::class, 'retroAnalytics']);
            
            // ═══════════════════════════════════════════════════
            // 📚 SUBJECT MANAGEMENT - RETRO STYLE ⭐ FIXED ⭐
            // ═══════════════════════════════════════════════════
            Route::prefix('subjects')->group(function () {
                // Standard CRUD with proper HTTP methods
                Route::get('/', [AdminSubject::class, 'index']);                    // List
                Route::post('/', [AdminSubject::class, 'store']);                   // Create
                Route::get('/{id}', [AdminSubject::class, 'show']);                 // Show
                Route::put('/{id}', [AdminSubject::class, 'update']);              // Update (full)
                Route::patch('/{id}', [AdminSubject::class, 'update']);            // Update (partial)
                Route::delete('/{id}', [AdminSubject::class, 'destroy']);          // Delete single
                Route::delete('/', [AdminSubject::class, 'destroy']);              // Delete bulk
                
                // Export endpoints
                Route::get('/export', [AdminSubject::class, 'export']);
                Route::get('/export/csv', [AdminSubject::class, 'export']);
                Route::get('/export/json', function (\Illuminate\Http\Request $request) {
                    $subjects = \App\Models\Subject::all();
                    return response()->json($subjects, 200, [
                        'Content-Disposition' => 'attachment; filename="subjects.json"'
                    ]);
                });
                
                // Retro-enhanced endpoints for frontend
                Route::get('/categories', [AdminSubject::class, 'categories']);
                Route::get('/grid', [AdminSubject::class, 'gridView']);
                Route::get('/list', [AdminSubject::class, 'index']); // Alias for consistency
                Route::get('/{id}/retro-preview', [AdminSubject::class, 'retroPreview']);
                
                // Bulk operations
                Route::post('/bulk/delete', [AdminSubject::class, 'bulkDelete']);
                Route::post('/bulk/export', [AdminSubject::class, 'bulkExport']);
                
                // Analytics
                Route::get('/analytics', [AdminSubject::class, 'analytics']);
            });
            
            // ═══════════════════════════════════════════════════
            // 📅 SCHEDULE MANAGEMENT - RETRO STYLE
            // ═══════════════════════════════════════════════════
            Route::prefix('schedules')->group(function () {
                Route::get('/', [AdminSchedule::class, 'index']);
                Route::post('/', [AdminSchedule::class, 'store']);
                Route::get('/{id}', [AdminSchedule::class, 'show']);
                Route::put('/{id}', [AdminSchedule::class, 'update']);
                Route::patch('/{id}', [AdminSchedule::class, 'update']);
                Route::delete('/{id}', [AdminSchedule::class, 'destroy']);
                Route::delete('/', [AdminSchedule::class, 'destroy']);
                
                Route::get('/export', [AdminSchedule::class, 'export']);
                Route::get('/export/csv', [AdminSchedule::class, 'exportCSV']);
                Route::get('/export/json', [AdminSchedule::class, 'exportJSON']);
                Route::post('/check-conflict', [AdminSchedule::class, 'checkConflict']);
                Route::get('/check-conflict/retro', [AdminSchedule::class, 'retroCheckConflict']);
                Route::get('/by-teacher/{teacherId}', [AdminSchedule::class, 'byTeacher']);
                Route::get('/by-class/{classId}', [AdminSchedule::class, 'byClass']);
                Route::get('/weekly-view', [AdminSchedule::class, 'weeklyView']);
                Route::get('/retro-weekly', [AdminSchedule::class, 'retroWeeklyView']);
                Route::post('/bulk/delete', [AdminSchedule::class, 'bulkDelete']);
                Route::post('/bulk/export', [AdminSchedule::class, 'bulkExport']);
                Route::get('/templates', [AdminSchedule::class, 'templates']);
                Route::post('/from-template', [AdminSchedule::class, 'createFromTemplate']);
            });
            
            // ═══════════════════════════════════════════════════
            // ⚙️ SYSTEM SETTINGS - RETRO STYLE
            // ═══════════════════════════════════════════════════
            Route::prefix('settings')->group(function () {
                Route::get('/', [SettingController::class, 'index']);
                Route::get('/retro', [SettingController::class, 'retroIndex']);
                Route::put('/', [SettingController::class, 'update']);
                Route::put('/section/{section}', [SettingController::class, 'updateSection']);
                Route::post('/reset', [SettingController::class, 'reset']);
                Route::post('/reset/section/{section}', [SettingController::class, 'resetSection']);
                Route::get('/export', [SettingController::class, 'export']);
                Route::get('/export/json', [SettingController::class, 'exportJSON']);
                Route::get('/categories', [SettingController::class, 'categories']);
                Route::get('/branding/preview', [SettingController::class, 'brandingPreview']);
                Route::get('/notification-templates', [SettingController::class, 'notificationTemplates']);
                Route::post('/notification-templates/{id}/test', [SettingController::class, 'testNotification']);
            });
            
            // ═══════════════════════════════════════════════════
            // 💼 PKL LOCATION MANAGEMENT - RETRO STYLE
            // ═══════════════════════════════════════════════════
            Route::prefix('pkl-locations')->group(function () {
                Route::get('/', [PklLocationController::class, 'index']);
                Route::post('/', [PklLocationController::class, 'store']);
                Route::get('/{id}', [PklLocationController::class, 'show']);
                Route::put('/{id}', [PklLocationController::class, 'update']);
                Route::patch('/{id}', [PklLocationController::class, 'update']);
                Route::delete('/{id}', [PklLocationController::class, 'destroy']);
                Route::delete('/', [PklLocationController::class, 'destroy']);
                
                Route::patch('/{id}/approve', [PklLocationController::class, 'approve']);
                Route::patch('/{id}/retro-approve', [PklLocationController::class, 'retroApprove']);
                Route::get('/approved', [PklLocationController::class, 'getApproved']);
                Route::get('/grid', [PklLocationController::class, 'gridView']);
                Route::get('/map-data', [PklLocationController::class, 'mapData']);
                Route::post('/bulk/delete', [PklLocationController::class, 'bulkDelete']);
                Route::post('/bulk/export', [PklLocationController::class, 'bulkExport']);
            });
            
            // PKL Student Assignment - Retro UI
            // 💼 PKL / INTERNSHIP MANAGEMENT
            Route::prefix('pkl')->group(function () {
                Route::get('/students', [PklLocationController::class, 'getStudents']);
                Route::get('/students/search', [PklLocationController::class, 'searchStudents']);
                Route::post('/assign', [PklLocationController::class, 'assignStudents']);
                Route::post('/assign/bulk', [PklLocationController::class, 'bulkAssign']);
                Route::post('/unassign/{studentId}', [PklLocationController::class, 'unassignStudent']);
                Route::get('/assignments/export', [PklLocationController::class, 'exportAssignments']);
                Route::get('/analytics', [PklLocationController::class, 'analytics']);
            });

            // ⏱️ ATTENDANCE MANAGEMENT
            Route::prefix('attendance')->group(function () {
                Route::get('/', [\App\Http\Controllers\Admin\AttendanceController::class, 'index']);
                Route::patch('/{id}/status', [\App\Http\Controllers\Admin\AttendanceController::class, 'updateStatus']);
            });
            
            // ═══════════════════════════════════════════════════
            // 🔧 SYSTEM UTILITIES - RETRO STYLE
            // ═══════════════════════════════════════════════════
            
            // Cache Management
            Route::post('/cache/clear', function () {
                Cache::flush();
                return response()->json(['status' => 'success', 'message' => '🧹 Cache cleared', 'retro_effect' => '✨ Sparkles!'], 200);
            });
            Route::post('/cache/clear/section/{section}', function ($section) {
                Cache::tags([$section])->flush();
                return response()->json(['status' => 'success', 'message' => "Cache section '{$section}' cleared"], 200);
            });
            
            // Log Management (Retro Terminal Style)
            Route::post('/logs/clear', function () {
                if (Storage::disk('logs')->exists('laravel.log')) {
                    Storage::disk('logs')->delete('laravel.log');
                }
                return response()->json(['status' => 'success', 'message' => '🗑️ Logs cleared'], 200);
            });
            Route::get('/logs/recent', function () {
                $logPath = storage_path('logs/laravel.log');
                if (!file_exists($logPath)) return response()->json(['logs' => []], 200);
                $logs = array_slice(file($logPath, FILE_IGNORE_NEW_LINES), -100);
                return response()->json(['logs' => array_reverse($logs), 'count' => count($logs)], 200);
            });
            
            // Database Utilities
            Route::post('/database/optimize', function () {
                Artisan::call('optimize');
                return response()->json(['status' => 'success', 'message' => '⚡ Database optimized'], 200);
            });
            Route::post('/database/backup', function () {
                // Trigger backup via queue
                \App\Jobs\BackupDatabase::dispatch();
                return response()->json(['status' => 'success', 'message' => '💾 Backup started'], 200);
            });
            
            // System Info (Retro Terminal)
            Route::get('/system/info', function () {
                return response()->json([
                    'server' => [
                        'os' => php_uname('s'),
                        'php' => PHP_VERSION,
                        'memory_limit' => ini_get('memory_limit'),
                        'max_execution' => ini_get('max_execution_time'),
                    ],
                    'app' => [
                        'name' => config('app.name'),
                        'env' => config('app.env'),
                        'debug' => config('app.debug'),
                        'timezone' => config('app.timezone'),
                        'locale' => config('app.locale'),
                    ],
                    'database' => [
                        'driver' => config('database.default'),
                        'host' => config('database.connections.' . config('database.default') . '.host'),
                        'database' => config('database.connections.' . config('database.default') . '.database'),
                    ],
                    'retro_theme' => [
                        'enabled' => true,
                        'version' => '2.0.0',
                        'palette' => ['orange' => '#FF5C00', 'blue' => '#2E2BBF', 'yellow' => '#FFC928'],
                    ],
                ], 200);
            });

            // ═══════════════════════════════════════════════════
            // 📊 ANALYTICS CONTROLLER (DEDICATED)
            // ═══════════════════════════════════════════════════
            Route::prefix('analytics')->group(function () {
                Route::get('/', [AnalyticsController::class, 'index']);
                Route::get('/attendance', [AnalyticsController::class, 'attendanceAnalytics']);
                Route::get('/students', [AnalyticsController::class, 'studentAnalytics']);
                Route::get('/classes', [AnalyticsController::class, 'classAnalytics']);
                Route::get('/subjects', [AnalyticsController::class, 'subjectAnalytics']);
                Route::get('/pkl', [AnalyticsController::class, 'pklAnalytics']);
                Route::get('/export', [AnalyticsController::class, 'export']);
                Route::get('/export/csv', [AnalyticsController::class, 'exportCSV']);
                Route::get('/realtime', [AnalyticsController::class, 'realtime']);
            });
        });

    // ═══════════════════════════════════════════════════════════
    // 🔄 WEBSOCKET / REAL-TIME ENDPOINTS (Future-Proof)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/realtime')->middleware('auth:sanctum')->group(function () {
        Route::get('/attendance/live', function () {
            return response()->json(['status' => 'connected', 'channel' => 'attendance.live'], 200);
        });
        Route::get('/notifications', function () {
            return response()->json(['status' => 'connected', 'channel' => 'notifications.' . (auth()->id() ?? 0)], 200);
        });
    });

}); // END api middleware group

// ═══════════════════════════════════════════════════════════
// 🎨 RETRO FALLBACK & ERROR HANDLING (MUST BE LAST!)
// ═══════════════════════════════════════════════════════════
Route::fallback(function () {
    return response()->json([
        'status' => 'error',
        'message' => '🔍 Route not found',
        'code' => 'ROUTE_NOT_FOUND',
        'retro_hint' => 'Check your API endpoint spelling! ✨',
        'available_endpoints' => [
            'GET /health',
            'GET /status', 
            'POST /v1/auth/login',
            'GET /v1/admin/dashboard',
            'GET /v1/admin/subjects',
        ],
    ], 404);
});

// ═══════════════════════════════════════════════════════════
// 🚀 API DOCUMENTATION ROUTE (Retro Style) - MUST BE OUTSIDE api group
// ═══════════════════════════════════════════════════════════
Route::get('/docs', function () {
    return response()->json([
        'api_name' => 'RPL Smart Ecosystem API',
        'version' => '2.0.0-retro',
        'theme' => 'Retro Futuristic / Y2K / Sticker-Bomb',
        'base_url' => config('app.url') . '/api',
        'authentication' => 'Bearer Token (Sanctum)',
        'roles' => ['admin', 'guru', 'siswa'],
        'endpoints' => [
            'Public' => [
                'GET /v1/public/landing' => 'Landing page data',
                'GET /v1/public/gallery' => 'Student gallery',
                'GET /v1/public/simulator/paths' => 'Career simulator paths',
            ],
            'Auth' => [
                'POST /v1/auth/login' => 'User login',
                'POST /v1/auth/logout' => 'User logout (auth required)',
                'GET /v1/auth/me' => 'Current user profile',
            ],
            'Student' => [
                'GET /v1/student/dashboard' => 'Student dashboard',
                'POST /v1/student/attendance' => 'Submit attendance',
                'GET /v1/student/projects' => 'List projects',
            ],
            'Teacher' => [
                'GET /v1/teacher/dashboard' => 'Teacher dashboard',
                'POST /v1/teacher/attendance/session/create' => 'Create attendance session',
                'GET /v1/teacher/permissions' => 'List permissions',
            ],
            'Admin' => [
                'GET /v1/admin/dashboard' => 'Admin dashboard',
                'GET /v1/admin/users' => 'List users',
                'POST /v1/admin/users' => 'Create user',
                'GET /v1/admin/settings' => 'Get settings',
                'PUT /v1/admin/settings' => 'Update settings',
                'GET /v1/admin/pkl-locations' => 'List PKL locations',
                'POST /v1/admin/pkl-locations' => 'Create PKL location',
                'GET /v1/admin/subjects' => 'List subjects',
            ],
        ],
        'response_format' => [
            'success' => ['status' => 'success', 'message' => '...', 'data' => '...'],
            'error' => ['status' => 'error', 'message' => '...', 'code' => '...', 'errors' => '...'],
        ],
        'retro_features' => [
            'Export CSV/JSON' => 'Most list endpoints support ?format=csv or ?format=json',
            'Category Filters' => 'Use ?category=productive|normative|adaptive for subjects',
            'Grid/List Views' => 'Use /grid or /list suffix for different UI layouts',
            'Retro Previews' => 'Use /retro-preview endpoints for sticker-style previews',
        ],
        'support' => 'Contact admin@rpl-smart.local for API support ✨',
    ], 200);
});