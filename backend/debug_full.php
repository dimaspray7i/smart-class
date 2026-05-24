<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== COLUMNS: class_user ===\n";
$cols = DB::select('DESCRIBE class_user');
foreach ($cols as $c) {
    $null = $c->Null === 'YES' ? 'nullable' : 'NOT NULL';
    $default = $c->Default ?? 'no default';
    echo "  {$c->Field} ({$c->Type}) {$null} default={$default}\n";
}

echo "\n=== COLUMNS: schedules ===\n";
$cols = DB::select('DESCRIBE schedules');
foreach ($cols as $c) {
    $null = $c->Null === 'YES' ? 'nullable' : 'NOT NULL';
    echo "  {$c->Field} ({$c->Type}) {$null}\n";
}

echo "\n=== class_user data (raw) ===\n";
$rows = DB::table('class_user')->get();
foreach ($rows as $r) {
    echo "  " . json_encode((array)$r) . "\n";
}

echo "\n=== Test API endpoint simulation ===\n";
// Simulate what the API does
$teacherId = 2;

$scheduleClassIds = DB::table('schedules')
    ->where('teacher_id', $teacherId)
    ->where('is_active', true)
    ->pluck('class_id')
    ->unique()
    ->toArray();

$classUserIds = DB::table('class_user')
    ->where('user_id', $teacherId)
    ->where('is_active', true)
    ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
    ->pluck('class_id')
    ->unique()
    ->toArray();

echo "scheduleClassIds: " . json_encode($scheduleClassIds) . "\n";
echo "classUserIds: " . json_encode($classUserIds) . "\n";

$classIds = array_unique(array_merge($scheduleClassIds, $classUserIds));
echo "final classIds: " . json_encode($classIds) . "\n";

// Now query students
use App\Models\User;

if (!empty($classIds)) {
    $students = User::where('role', 'siswa')
        ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $classIds))
        ->with(['profile', 'classes' => fn($q) => $q->whereIn('classes.id', $classIds)->select('classes.id', 'classes.name')])
        ->orderBy('name')
        ->paginate(50);
    
    echo "Students count: " . $students->total() . "\n";
    foreach ($students->items() as $s) {
        $class = $s->classes->first();
        echo "  id={$s->id} name={$s->name} class_id=" . ($class ? $class->id : 'NULL') . " class_name=" . ($class ? $class->name : 'NULL') . "\n";
    }
}

echo "\nDone.\n";
