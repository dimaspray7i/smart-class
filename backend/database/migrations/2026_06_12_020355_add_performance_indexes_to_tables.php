<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Index Migration
 *
 * Adds composite indexes identified during the code audit as missing.
 * These indexes significantly speed up:
 *   1. Teacher IDOR check (class_user): user_id + role_in_class + is_active
 *   2. Permission dashboard filters (permissions): user_id + status + created_at
 *   3. Teacher session overview (attendance_sessions): teacher_id + status + date
 *   4. Login audit queries (login_histories): user_id + created_at
 *   5. Student skills analytics (student_skills): user_id + level
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── class_user: composite for teacher IDOR guard & student lookup ──
        Schema::table('class_user', function (Blueprint $table) {
            // Used in: PermissionController::store IDOR check
            // and teacher dashboard student-list queries
            if (!$this->hasIndex('class_user', 'class_user_user_role_active_index')) {
                $table->index(['user_id', 'role_in_class', 'is_active'], 'class_user_user_role_active_index');
            }
            // Used in: IDOR check - filter by class_id + role + active
            if (!$this->hasIndex('class_user', 'class_user_class_role_active_index')) {
                $table->index(['class_id', 'role_in_class', 'is_active'], 'class_user_class_role_active_index');
            }
        });

        // ── permissions: composite for status-filtered queries ──
        Schema::table('permissions', function (Blueprint $table) {
            // Used in: PermissionService::getPermissions - filters by user_id + status
            if (!$this->hasIndex('permissions', 'permissions_user_status_index')) {
                $table->index(['user_id', 'status'], 'permissions_user_status_index');
            }
            // Used in: PermissionService::getAnalytics - filters by user_id + type
            if (!$this->hasIndex('permissions', 'permissions_user_type_index')) {
                $table->index(['user_id', 'type'], 'permissions_user_type_index');
            }
            // Used in: history / export queries - filters by date range
            if (!$this->hasIndex('permissions', 'permissions_user_date_from_index')) {
                $table->index(['user_id', 'date_from'], 'permissions_user_date_from_index');
            }
        });

        // ── attendance_sessions: for teacher session management ──
        if (Schema::hasTable('attendance_sessions')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                // Used in: TeacherAttendance::sessions - filter by teacher + status + date
                if (!$this->hasIndex('attendance_sessions', 'att_sessions_gen_status_index')) {
                    $table->index(['generated_by', 'status'], 'att_sessions_gen_status_index');
                }
            });
        }

        // ── login_histories: for security audit & suspicious login detection ──
        if (Schema::hasTable('login_histories')) {
            Schema::table('login_histories', function (Blueprint $table) {
                if (!$this->hasIndex('login_histories', 'login_histories_user_created_index')) {
                    $table->index(['user_id', 'created_at'], 'login_histories_user_created_index');
                }
            });
        }

        // ── student_skills: for analytics skill-level grouping ──
        if (Schema::hasTable('student_skills')) {
            Schema::table('student_skills', function (Blueprint $table) {
                if (!$this->hasIndex('student_skills', 'student_skills_user_level_index')) {
                    $table->index(['user_id', 'level'], 'student_skills_user_level_index');
                }
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('class_user', 'class_user_user_role_active_index');
        $this->dropIndexIfExists('class_user', 'class_user_class_role_active_index');

        $this->dropIndexIfExists('permissions', 'permissions_user_status_index');
        $this->dropIndexIfExists('permissions', 'permissions_user_type_index');
        $this->dropIndexIfExists('permissions', 'permissions_user_date_from_index');

        if (Schema::hasTable('attendance_sessions')) {
            $this->dropIndexIfExists('attendance_sessions', 'att_sessions_gen_status_index');
        }

        if (Schema::hasTable('login_histories')) {
            $this->dropIndexIfExists('login_histories', 'login_histories_user_created_index');
        }

        if (Schema::hasTable('student_skills')) {
            $this->dropIndexIfExists('student_skills', 'student_skills_user_level_index');
        }
    }

    /**
     * Helper to safely drop an index if it exists.
     */
    private function dropIndexIfExists(string $tableName, string $indexName): void
    {
        if ($this->hasIndex($tableName, $indexName)) {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        }
    }

    /**
     * Helper to safely check if an index already exists (prevent duplicate index errors).
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = collect(\Illuminate\Support\Facades\DB::select("SHOW INDEX FROM `{$table}`"));
        return $indexes->contains('Key_name', $indexName);
    }
};
