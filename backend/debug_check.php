<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TEACHERS ===\n";
$teachers = DB::table('users')->where('role', 'guru')->get(['id', 'name', 'email']);
foreach ($teachers as $t) {
    echo "  id={$t->id} name={$t->name} email={$t->email}\n";
}

echo "\n=== CLASS_USER TABLE ===\n";
$cu = DB::table('class_user')->get();
echo "Total rows: " . $cu->count() . "\n";
foreach ($cu as $r) {
    $active = $r->is_active ?? 'NULL';
    echo "  user_id={$r->user_id} class_id={$r->class_id} role={$r->role_in_class} is_active={$active}\n";
}

echo "\n=== SCHEDULES TABLE ===\n";
$schedules = DB::table('schedules')->get(['id', 'teacher_id', 'class_id', 'subject_id', 'is_active', 'day']);
echo "Total rows: " . $schedules->count() . "\n";
foreach ($schedules as $r) {
    echo "  id={$r->id} teacher_id={$r->teacher_id} class_id={$r->class_id} is_active={$r->is_active} day={$r->day}\n";
}

echo "\n=== STUDENTS (siswa) ===\n";
$students = DB::table('users')->where('role', 'siswa')->get(['id', 'name']);
echo "Total students: " . $students->count() . "\n";
foreach ($students as $s) {
    echo "  id={$s->id} name={$s->name}\n";
}

echo "\n=== CLASSES ===\n";
$classes = DB::table('classes')->get(['id', 'name']);
foreach ($classes as $c) {
    echo "  id={$c->id} name={$c->name}\n";
}

echo "\nDone.\n";
