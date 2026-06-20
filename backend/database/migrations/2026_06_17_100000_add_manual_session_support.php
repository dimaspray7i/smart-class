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
        // Check if attendance_sessions table exists
        if (!Schema::hasTable('attendance_sessions')) {
            return;
        }

        Schema::table('attendance_sessions', function (Blueprint $table) {
            // ═══════════════════════════════════════════════════
            // 1. Make schedule_id nullable for manual sessions
            // ═══════════════════════════════════════════════════
            if (Schema::hasColumn('attendance_sessions', 'schedule_id')) {
                try {
                    $table->unsignedBigInteger('schedule_id')->nullable()->change();
                } catch (\Exception $e) {
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
                if (!Schema::hasColumn('attendances', 'attendance_session_id')) {
                    $table->foreignId('attendance_session_id')->nullable()->after('id')->constrained('attendance_sessions')->onDelete('set null');
                }

                try {
                    $table->unique(
                        ['attendance_session_id', 'user_id'],
                        'unique_attendance_per_session'
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Unique constraint already exists: ' . $e->getMessage());
                }

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
                if (Schema::hasColumn('attendance_sessions', 'is_manual')) {
                    $table->dropColumn('is_manual');
                }

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

                try {
                    $table->dropForeign(['attendance_session_id']);
                } catch (\Exception $e) {
                    //
                }

                if (Schema::hasColumn('attendances', 'attendance_session_id')) {
                    $table->dropColumn('attendance_session_id');
                }
            });
        }
    }
};
