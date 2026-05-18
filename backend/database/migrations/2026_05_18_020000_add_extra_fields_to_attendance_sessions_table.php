<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add missing operational fields to attendance_sessions:
     * - location, notes, start_time, end_time
     * - status enum: active | closed | reopened | expired
     * - reopened_by, reopened_at, reopen_notes, reopen_count
     */
    public function up(): void
    {
        // Fix any invalid zero-datetime rows that would block FK addition in MySQL strict mode
        DB::statement("UPDATE attendance_sessions SET updated_at = NOW() WHERE updated_at = '0000-00-00 00:00:00'");
        DB::statement("UPDATE attendance_sessions SET created_at = NOW() WHERE created_at = '0000-00-00 00:00:00'");
        DB::statement("UPDATE attendance_sessions SET valid_from = NOW() WHERE valid_from = '0000-00-00 00:00:00'");
        DB::statement("UPDATE attendance_sessions SET valid_until = NOW() WHERE valid_until = '0000-00-00 00:00:00'");

        Schema::table('attendance_sessions', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_sessions', 'location')) {
                $table->string('location')->nullable()->after('center_lng');
            }
            if (!Schema::hasColumn('attendance_sessions', 'notes')) {
                $table->text('notes')->nullable()->after('location');
            }
            if (!Schema::hasColumn('attendance_sessions', 'start_time')) {
                $table->time('start_time')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('attendance_sessions', 'end_time')) {
                $table->time('end_time')->nullable()->after('start_time');
            }
            if (!Schema::hasColumn('attendance_sessions', 'status')) {
                $table->enum('status', ['active', 'closed', 'reopened', 'expired'])
                      ->default('active')
                      ->after('is_active');
            }
            // Add reopened_by as plain unsignedBigInteger first (no FK yet)
            if (!Schema::hasColumn('attendance_sessions', 'reopened_by')) {
                $table->unsignedBigInteger('reopened_by')->nullable()->after('status');
            }
            if (!Schema::hasColumn('attendance_sessions', 'reopened_at')) {
                $table->timestamp('reopened_at')->nullable()->after('reopened_by');
            }
            if (!Schema::hasColumn('attendance_sessions', 'reopen_notes')) {
                $table->text('reopen_notes')->nullable()->after('reopened_at');
            }
            if (!Schema::hasColumn('attendance_sessions', 'reopen_count')) {
                $table->unsignedSmallInteger('reopen_count')->default(0)->after('reopen_notes');
            }
        });

        // Add FK separately after all columns are in place
        try {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->foreign('reopened_by')->references('id')->on('users')->nullOnDelete();
            });
        } catch (\Exception $e) {
            // FK may already exist – safe to ignore
        }
    }

    public function down(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            try { $table->dropForeign(['reopened_by']); } catch (\Exception $e) {}
            $columns = [
                'location', 'notes', 'start_time', 'end_time',
                'status', 'reopened_by', 'reopened_at', 'reopen_notes', 'reopen_count'
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('attendance_sessions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
