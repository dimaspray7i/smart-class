<?php

use Illuminate\Support\Facades\Route;
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

// ═══════════════════════════════════════════════════════════
// WRAPPER: APPLY 'API' MIDDLEWARE GROUP TO ALL ROUTES
// ═══════════════════════════════════════════════════════════
Route::middleware('api')->group(function () {

    // Health Check Endpoint
    Route::get('/health', function () {
        return response()->json([
            'status' => 'success',
            'message' => 'RPL Smart is running!',
            'version' => '1.0.0',
            'timestamp' => now()->toDateTimeString(),
            'environment' => config('app.env'),
        ]);
    });

    // ═══════════════════════════════════════════════════════════
    // PUBLIC ROUTES (No Authentication Required)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/public')->group(function () {
        
        // Landing Page Routes
        Route::get('/landing', [LandingController::class, 'index']);
        Route::get('/stats', [LandingController::class, 'stats']);
        
        // Student Gallery Routes
        Route::get('/gallery', [StudentGalleryController::class, 'index']);
        Route::get('/gallery/{slug}', [StudentGalleryController::class, 'show']);
        
        // Career Path Simulator Routes
        Route::prefix('simulator')->group(function () {
            Route::get('/paths', [SimulatorController::class, 'index']);
            Route::get('/paths/{slug}', [SimulatorController::class, 'show']);
            Route::post('/sessions', [SimulatorController::class, 'startSession']);
            Route::post('/sessions/{id}/choice', [SimulatorController::class, 'submitChoice']);
            Route::get('/sessions/{id}/result', [SimulatorController::class, 'getResult']);
        });
    });

    // ═══════════════════════════════════════════════════════════
    // AUTHENTICATION ROUTES
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/auth')->group(function () {
        
        // Public login route
        Route::post('/login', [AuthController::class, 'login']);
        
        // Protected auth routes (require authentication)
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
            Route::post('/token/refresh', [AuthController::class, 'refreshToken']);
        });
    });

    // ═══════════════════════════════════════════════════════════
    // STUDENT ROUTES (Role: siswa)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/student')
        ->middleware(['auth:sanctum', 'role:siswa'])
        ->group(function () {
            
            // Student Dashboard
            Route::get('/dashboard', [StudentDashboard::class, 'index']);
            
            // Student Attendance Routes
            Route::prefix('attendance')->group(function () {
                Route::post('/', [StudentAttendance::class, 'store']);
                Route::get('/history', [StudentAttendance::class, 'history']);
                Route::get('/stats', [StudentAttendance::class, 'stats']);
                Route::get('/today', [StudentAttendance::class, 'todayStatus']);
            });
            
            // Student Project Routes (CRUD)
            Route::apiResource('projects', StudentProject::class);
            Route::get('/projects/{project}/logs', [StudentProject::class, 'logs']);
            Route::post('/projects/{project}/logs', [StudentProject::class, 'storeLog']);
            
            // Student Skill Routes
            Route::prefix('skills')->group(function () {
                Route::get('/', [StudentSkill::class, 'index']);
                Route::get('/progress', [StudentSkill::class, 'progress']);
                Route::post('/{skill}/activity', [StudentSkill::class, 'logActivity']);
            });
        });

    // ═══════════════════════════════════════════════════════════
    // TEACHER ROUTES (Role: guru)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/teacher')
        ->middleware(['auth:sanctum', 'role:guru'])
        ->group(function () {
            
            // Teacher Dashboard
            Route::get('/dashboard', [TeacherDashboard::class, 'index']);
            
            // Teacher Attendance Control Routes
            Route::prefix('attendance')->group(function () {
                Route::post('/session/create', [TeacherAttendance::class, 'createSession']);
                Route::post('/session/{id}/generate-code', [TeacherAttendance::class, 'generateCode']);
                Route::post('/session/{id}/close', [TeacherAttendance::class, 'closeSession']);
                Route::get('/session/{id}/monitor', [TeacherAttendance::class, 'monitor']);
                Route::get('/history', [TeacherAttendance::class, 'history']);
                Route::patch('/{id}/verify', [TeacherAttendance::class, 'manualVerify']);
            });
            
            // Teacher Student Management Routes
            Route::get('/students', [TeacherAttendance::class, 'students']);
            Route::get('/students/{id}/attendance', [TeacherAttendance::class, 'studentAttendance']);
            
            // Teacher Permission Routes
            Route::prefix('permissions')->group(function () {
                Route::get('/', [TeacherPermission::class, 'index']);
                Route::post('/', [TeacherPermission::class, 'store']);
                Route::patch('/{id}/approve', [TeacherPermission::class, 'approve']);
                Route::patch('/{id}/reject', [TeacherPermission::class, 'reject']);
                Route::get('/history', [TeacherPermission::class, 'history']);
            });
        });

    // ═══════════════════════════════════════════════════════════
    // ADMIN ROUTES (Role: admin)
    // ═══════════════════════════════════════════════════════════
    Route::prefix('v1/admin')
        ->middleware(['auth:sanctum', 'role:admin'])
        ->group(function () {
            
            // Admin Dashboard & Analytics
            Route::get('/dashboard', [AdminDashboard::class, 'index']);
            Route::get('/analytics/attendance', [AdminDashboard::class, 'attendanceAnalytics']);
            Route::get('/analytics/students', [AdminDashboard::class, 'studentAnalytics']);
            
            // Admin User Management Routes
            Route::apiResource('users', AdminUser::class);
            Route::get('/users/export', [AdminUser::class, 'export']);
            Route::post('/users/{user}/reset-password', [AdminUser::class, 'resetPassword']);
            Route::patch('/users/{user}/role', [AdminUser::class, 'updateRole']);
            
            // Admin Class Management Routes
            Route::apiResource('classes', AdminClass::class);
            Route::get('/classes/export', [AdminClass::class, 'export']);
            
            // Admin Subject Management Routes
            Route::apiResource('subjects', AdminSubject::class);
            Route::get('/subjects/export', [AdminSubject::class, 'export']);
            
            // Admin Schedule Management Routes
            Route::apiResource('schedules', AdminSchedule::class);
            Route::get('/schedules/export', [AdminSchedule::class, 'export']);
            Route::get('/schedules/check-conflict', [AdminSchedule::class, 'checkConflict']);
            Route::get('/schedules/by-teacher/{teacherId}', [AdminSchedule::class, 'byTeacher']);
            
            // Admin Settings Routes
            Route::prefix('settings')->group(function () {
                Route::get('/general', [AdminDashboard::class, 'settings']);
                Route::put('/general', [AdminDashboard::class, 'updateSettings']);
            });
        });

});