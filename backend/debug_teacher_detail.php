<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

$user = User::with([
    'profile', 
    'profile.subjects', 
    'classes' => function($q) {
        $q->withCount('students as students_count');
    },
    'taughtSchedules.class',
    'taughtSchedules.subject'
])->find(2);

if ($user) {
    $user->classes_count = $user->classes->count();
    $user->students_count = $user->classes->sum('students_count');
    $user->subjects = $user->profile?->subjects ?? [];
    
    echo "Classes count: {$user->classes_count}\n";
    echo "Students count: {$user->students_count}\n";
    echo "Subjects: " . json_encode($user->subjects) . "\n";
} else {
    echo "User not found\n";
}
