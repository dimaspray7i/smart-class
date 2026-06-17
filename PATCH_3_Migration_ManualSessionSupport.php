<?php
/**
 * MIGRATION: Add Manual Session Support & Fix Constraints
 *
 * This migration:
 * 1. Makes schedule_id nullable (for manual sessions)
 * 2. Adds is_manual boolean flag
 * 3. Adds qr_code storage
 * 4. Adds performance indices
 * 5. Fixes attendance table constraints
 *
 * File location: backend/database/migrations/2026_06_17_000000_add_manual_session_support.php
 *
 * Run with: php artisan migrate
 */

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════
        // UPDATE attendance_sessions TABLE
        // ═══════════════════════════════════════════════════════
        Schema::table('attendance_sessions', function (Blueprint $table) {
            // Make schedule_id nullable to support manual sessions
            $table->unsignedBigInteger('schedule_id')->nullable()->change();

            // Add flag to distinguish manual vs scheduled sessions
            $table->boolean('is_manual')->default(false)->after('schedule_id');

            // Add QR code storage (base64 encoded PNG)
            $table->longText('qr_code')->nullable()->after('code');

            // Add indices for common queries
            $table->index('valid_until', 'idx_attendance_sessions_valid_until');
            $table->index(['generated_by', 'valid_until'], 'idx_attendance_sessions_teacher_valid');
            $table->index('is_active', 'idx_attendance_sessions_is_active');
        });

        // ═══════════════════════════════════════════════════════
        // UPDATE attendances TABLE (if exists)
        // ═══════════════════════════════════════════════════════
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                // Add unique constraint to prevent duplicate attendance submission
                // Prevents same student from attending twice in one session on same day
                try {
                    $table->unique(
                        [DB::raw('attendance_session_id'), 'user_id', DB::raw('DATE(created_at)')],
                        'unique_attendance_per_session'
                    );
                } catch (\Exception $e) {
                    // Constraint might already exist
                    \Illuminate\Support\Facades\Log::warning('Unique constraint already exists', [
                        'constraint' => 'unique_attendance_per_session',
                        'error' => $e->getMessage(),
                    ]);
                }

                // Add index on commonly filtered columns
                if (!Schema::hasColumn('attendances', 'attendance_session_id')) {
                    // The column should exist from previous migration
                } else {
                    $table->index('attendance_session_id', 'idx_attendance_session_id');
                    $table->index(['user_id', 'created_at'], 'idx_attendance_user_date');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            // Drop added columns
            $table->dropColumn('is_manual');
            $table->dropColumn('qr_code');

            // Drop added indices
            $table->dropIndex('idx_attendance_sessions_valid_until');
            $table->dropIndex('idx_attendance_sessions_teacher_valid');
            $table->dropIndex('idx_attendance_sessions_is_active');
        });

        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                // Drop unique constraint
                $table->dropUnique('unique_attendance_per_session');

                // Drop indices
                $table->dropIndex('idx_attendance_session_id');
                $table->dropIndex('idx_attendance_user_date');
            });
        }
    }
};
