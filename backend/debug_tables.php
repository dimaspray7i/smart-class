<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== ALL TABLES ===\n";
$tables = DB::select('SHOW TABLES');
foreach ($tables as $t) {
    $arr = (array)$t;
    echo "  " . reset($arr) . "\n";
}

echo "\n=== MESSAGES TABLE CHECK ===\n";
try {
    $count = DB::table('messages')->count();
    echo "messages count: $count\n";
} catch (\Exception $e) {
    echo "ERROR accessing messages: " . $e->getMessage() . "\n";
}
