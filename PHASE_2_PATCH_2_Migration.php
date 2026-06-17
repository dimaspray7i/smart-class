<?php
/**
 * PHASE 2 PATCH 2: Migration - Add Manual Session Support
 *
 * Adds:
 * 1. is_manual boolean field (distinguish manual vs scheduled)
 * 2. Makes schedule_id nullable (for manual sessions)
 * 3. Adds performance indices
 *
 * File location: backend/database/migrations/2026_06_17_100000_add_manual_session_support.php
 *
 * ACTION:
 * 1. Create new file with name above
 * 2. Copy this code into it
 * 3. Run: php artisan migrate
 *
 * ====================================
 */

namespace Database\Migrations;

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
        // Check if attendance_sessions table exists
        if (!Schema::hasTable('attendance_sessions')) {
            return; // Skip if table doesn't exist
        }

        Schema::table('attendance_sessions', function (Blueprint $table) {
            // ═══════════════════════════════════════════════════
            // 1. Make schedule_id nullable for manual sessions
            // ═══════════════════════════════════════════════════
            // Only if column exists and is not already nullable
            if (Schema::hasColumn('attendance_sessions', 'schedule_id')) {
                try {
                    $table->unsignedBigInteger('schedule_id')->nullable()->change();
                } catch (\Exception $e) {
                    // Column might already be nullable or doesn't exist
                    \Illuminate\Support\Facades\Log::info('schedule_id already processed: ' . $e->getMessage());
                }
            }

            // ═══════════════════════════════════════════════════
            // 2. Add is_manual flag
            // ═══════════════════════════════════════════════════
            if (!Schema::hasColumn('attendance_sessions', 'is_manual')) {
                $table->boolean('is_manual')
                    ->default(false)
                    ->after('schedule_id')
                    ->comment('true = manual session, false = scheduled from jadwal');
            }

            // ═══════════════════════════════════════════════════
            // 3. Add indices for performance
            // ═══════════════════════════════════════════════════
            try {
                if (!Schema::hasIndex('attendance_sessions', 'idx_valid_until')) {
                    $table->index('valid_until', 'idx_valid_until');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Index idx_valid_until already exists');
            }

            try {
                if (!Schema::hasIndex('attendance_sessions', 'idx_generated_by_valid_until')) {
                    $table->index(['generated_by', 'valid_until'], 'idx_generated_by_valid_until');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Index idx_generated_by_valid_until already exists');
            }

            try {
                if (!Schema::hasIndex('attendance_sessions', 'idx_is_active')) {
                    $table->index('is_active', 'idx_is_active');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Index idx_is_active already exists');
            }

            try {
                if (!Schema::hasIndex('attendance_sessions', 'idx_is_manual')) {
                    $table->index('is_manual', 'idx_is_manual');
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Index idx_is_manual already exists');
            }
        });

        // ═══════════════════════════════════════════════════
        // Fix attendances table for duplicate prevention
        // ═══════════════════════════════════════════════════
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                // Add unique constraint to prevent duplicate attendance
                try {
                    // Using a raw SQL for date comparison in unique constraint
                    $table->unique(
                        ['attendance_session_id', 'user_id'],
                        'unique_attendance_per_session'
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Unique constraint already exists: ' . $e->getMessage());
                }

                // Add indices
                try {
                    if (!Schema::hasIndex('attendances', 'idx_attendance_session_id')) {
                        $table->index('attendance_session_id', 'idx_attendance_session_id');
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Index idx_attendance_session_id already exists');
                }

                try {
                    if (!Schema::hasIndex('attendances', 'idx_attendance_user_created')) {
                        $table->index(['user_id', 'created_at'], 'idx_attendance_user_created');
                    }
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Index idx_attendance_user_created already exists');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('attendance_sessions')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                // Drop columns
                if (Schema::hasColumn('attendance_sessions', 'is_manual')) {
                    $table->dropColumn('is_manual');
                }

                // Drop indices
                try {
                    $table->dropIndex('idx_valid_until');
                } catch (\Exception $e) {
                    //
                }

                try {
                    $table->dropIndex('idx_generated_by_valid_until');
                } catch (\Exception $e) {
                    //
                }

                try {
                    $table->dropIndex('idx_is_active');
                } catch (\Exception $e) {
                    //
                }

                try {
                    $table->dropIndex('idx_is_manual');
                } catch (\Exception $e) {
                    //
                }
            });
        }

        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                try {
                    $table->dropUnique('unique_attendance_per_session');
                } catch (\Exception $e) {
                    //
                }

                try {
                    $table->dropIndex('idx_attendance_session_id');
                } catch (\Exception $e) {
                    //
                }

                try {
                    $table->dropIndex('idx_attendance_user_created');
                } catch (\Exception $e) {
                    //
                }
            });
        }
    }
};

// ====================================
// END OF PATCH 2
// ====================================
