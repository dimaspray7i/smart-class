<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_sessions', 'schedule_id')) {
                $table->foreignId('schedule_id')->nullable()->after('class_id')
                    ->constrained('schedules')->onDelete('cascade');
            }

            if (!Schema::hasColumn('attendance_sessions', 'subject_id')) {
                $table->foreignId('subject_id')->nullable()->after('schedule_id')
                    ->constrained('subjects')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('attendance_sessions', 'schedule_id')) {
                $table->dropForeign(['schedule_id']);
                $table->dropColumn('schedule_id');
            }

            if (Schema::hasColumn('attendance_sessions', 'subject_id')) {
                $table->dropForeign(['subject_id']);
                $table->dropColumn('subject_id');
            }
        });
    }
};
