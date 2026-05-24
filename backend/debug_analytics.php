<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\AttendanceSession;
use App\Models\Attendance;
use Carbon\Carbon;

$teacherId = 2;
$period = 'month';
$classId = null;

echo "=== Testing Analytics for teacher_id={$teacherId} period={$period} ===\n\n";

$now = now();
$startDate = match ($period) {
    'week'     => $now->copy()->startOfWeek(),
    'semester' => $now->copy()->subMonths(6)->startOfDay(),
    default    => $now->copy()->startOfMonth(),
};
$endDate = $now->copy()->endOfDay();

echo "Date range: {$startDate->toDateString()} → {$endDate->toDateString()}\n\n";

// Teacher's classes (via schedules)
$classQuery = \App\Models\Schedule::where('teacher_id', $teacherId)
    ->when($classId, fn($q) => $q->where('class_id', $classId))
    ->distinct()
    ->pluck('class_id');

echo "Classes from schedules: " . json_encode($classQuery->toArray()) . "\n";

// Count students
try {
    $totalStudents = User::where('role', 'siswa')
        ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $classQuery))
        ->count();
    echo "Total students: {$totalStudents}\n";
} catch (\Exception $e) {
    echo "ERROR counting students: " . $e->getMessage() . "\n";
}

// Sessions
try {
    $sessions = AttendanceSession::where('generated_by', $teacherId)
        ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()])
        ->when($classId, fn($q) => $q->where('class_id', $classId))
        ->count();
    echo "Sessions: {$sessions}\n";
} catch (\Exception $e) {
    echo "ERROR counting sessions: " . $e->getMessage() . "\n";
}

// Records
try {
    $records = Attendance::whereHas('session', function ($q) use ($teacherId, $startDate, $endDate, $classId) {
        $q->where('generated_by', $teacherId)
          ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()])
          ->when($classId, fn($sq) => $sq->where('class_id', $classId));
    });
    $totalRecords = (clone $records)->count();
    echo "Total records: {$totalRecords}\n";
} catch (\Exception $e) {
    echo "ERROR counting records: " . $e->getMessage() . "\n";
}

// Processed permissions
try {
    $processedPermissions = \App\Models\Permission::where('teacher_id', $teacherId)
        ->whereIn('status', ['approved', 'rejected'])
        ->whereBetween('created_at', [$startDate, $endDate])
        ->count();
    echo "Processed permissions: {$processedPermissions}\n";
} catch (\Exception $e) {
    echo "ERROR counting permissions: " . $e->getMessage() . "\n";
}

// By class
$classModels = ClassModel::whereIn('id', $classQuery)->get();
echo "Class models: " . $classModels->count() . "\n";

echo "\nDone.\n";
