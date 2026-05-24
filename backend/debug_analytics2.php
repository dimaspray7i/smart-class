<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\AttendanceSession;
use App\Models\Attendance;
use App\Models\Permission;
use Carbon\Carbon;

$teacherId = 2;
$period = 'month';
$classId = null;

try {
    $now = now();
    $startDate = $now->copy()->startOfMonth();
    $endDate = $now->copy()->endOfDay();

    // FIX: Get class IDs from BOTH sources
    $scheduleClassIds = DB::table('schedules')
        ->where('teacher_id', $teacherId)
        ->when($classId, fn($q) => $q->where('class_id', $classId))
        ->distinct()
        ->pluck('class_id')
        ->toArray();

    $classUserIds = DB::table('class_user')
        ->where('user_id', $teacherId)
        ->where('is_active', true)
        ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
        ->when($classId, fn($q) => $q->where('class_id', $classId))
        ->pluck('class_id')
        ->toArray();

    $classIds = array_values(array_unique(array_merge($scheduleClassIds, $classUserIds)));
    echo "Combined class IDs: " . json_encode($classIds) . "\n";

    $totalStudents = User::where('role', 'siswa')
        ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $classIds))
        ->count();
    echo "Total students: {$totalStudents}\n";

    $sessions = AttendanceSession::where('generated_by', $teacherId)
        ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()])
        ->count();
    echo "Sessions: {$sessions}\n";

    // Check if Attendance has session relation working
    $testRecords = Attendance::take(1)->get();
    echo "Attendance records exist: " . $testRecords->count() . "\n";

    // Try the whereHas query
    $records = Attendance::whereHas('session', function ($q) use ($teacherId, $startDate, $endDate) {
        $q->where('generated_by', $teacherId)
          ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()]);
    });
    $totalRecords = (clone $records)->count();
    echo "Total attendance records: {$totalRecords}\n";

    // By class
    $classModels = ClassModel::whereIn('id', $classIds)->get();
    echo "Classes: " . $classModels->pluck('name')->join(', ') . "\n";

    $byClass = [];
    foreach ($classModels as $cls) {
        $byClass[] = [
            'class_id' => $cls->id,
            'class_name' => $cls->name,
            'total' => 0,
            'hadir' => 0,
            'alpa' => 0,
            'izin' => 0,
        ];
    }

    echo "by_class prepared: " . count($byClass) . " entries\n";
    
    // Top students
    $topStudents = User::where('role', 'siswa')
        ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $classIds))
        ->with('profile')
        ->get()
        ->map(function ($student) use ($teacherId, $startDate, $endDate) {
            $total = Attendance::where('user_id', $student->id)
                ->whereHas('session', fn($q) => $q->where('generated_by', $teacherId)
                    ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()]))
                ->count();
            $hadir = Attendance::where('user_id', $student->id)
                ->whereHas('session', fn($q) => $q->where('generated_by', $teacherId)
                    ->whereBetween('created_at', [$startDate->toDateTimeString(), $endDate->toDateTimeString()]))
                ->whereIn('status', ['Hadir', 'Terlambat'])
                ->count();
            return [
                'id'              => $student->id,
                'name'            => $student->name,
                'attendance_rate' => $total > 0 ? round(($hadir / $total) * 100, 1) : 0,
            ];
        })
        ->sortByDesc('attendance_rate')
        ->values()
        ->take(10);

    echo "Top students: " . $topStudents->count() . "\n";
    foreach ($topStudents as $s) {
        echo "  - {$s['name']}: {$s['attendance_rate']}%\n";
    }
    
    echo "\nAll checks passed! Analytics would return:\n";
    echo json_encode([
        'period' => $period,
        'avg_attendance' => 0,
        'total_students' => $totalStudents,
        'total_sessions' => $sessions,
        'processed_permissions' => 0,
        'by_class' => $byClass,
        'top_students' => $topStudents->values()->toArray(),
    ], JSON_PRETTY_PRINT) . "\n";

} catch (\Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo "FILE: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "TRACE:\n" . $e->getTraceAsString() . "\n";
}
