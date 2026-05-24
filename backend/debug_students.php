<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;

$teacherId = 2; // Leni Marliati

echo "=== Testing getStudents for teacher_id={$teacherId} ===\n\n";

// Step 1: Get class IDs from schedules
$scheduleClassIds = DB::table('schedules')
    ->where('teacher_id', $teacherId)
    ->where('is_active', true)
    ->pluck('class_id')
    ->unique()
    ->toArray();
echo "Schedule class IDs: " . implode(',', $scheduleClassIds ?: ['NONE']) . "\n";

// Step 2: Get class IDs from class_user
$classUserIds = DB::table('class_user')
    ->where('user_id', $teacherId)
    ->where('is_active', true)
    ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
    ->pluck('class_id')
    ->unique()
    ->toArray();
echo "Class user IDs: " . implode(',', $classUserIds ?: ['NONE']) . "\n";

// Combine
$classIds = array_unique(array_merge($scheduleClassIds, $classUserIds));
echo "Combined class IDs: " . implode(',', $classIds ?: ['NONE']) . "\n\n";

if (empty($classIds)) {
    echo "ERROR: No class IDs found for this teacher!\n";
    exit(1);
}

// Step 3: Query students
echo "=== Querying students in classes: " . implode(',', $classIds) . " ===\n";

$query = User::where('role', 'siswa')
    ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $classIds))
    ->with(['profile', 'classes' => fn($q) => $q->whereIn('classes.id', $classIds)->select('classes.id', 'classes.name')]);

echo "SQL: " . $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n\n";

$students = $query->orderBy('name')->get();
echo "Students found: " . $students->count() . "\n";
foreach ($students as $s) {
    echo "  id={$s->id} name={$s->name} role={$s->role}\n";
    echo "  classes: " . $s->classes->pluck('name')->join(', ') . "\n";
}

// Also check class_user for student_id=3
echo "\n=== class_user entries for student id=3 ===\n";
$entries = DB::table('class_user')->where('user_id', 3)->get();
foreach ($entries as $e) {
    echo "  class_id={$e->class_id} role={$e->role_in_class} is_active={$e->is_active}\n";
}

echo "\nDone.\n";
