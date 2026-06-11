<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration is defensive: it checks if columns exist before modifying,
     * and creates base columns if they don't exist yet.
     */
    public function up(): void
    {
        // ═══════════════════════════════════════════════════════════
        // ATTENDANCE_SESSIONS TABLE
        // ═══════════════════════════════════════════════════════════
        
        // ── FIRST: Ensure base columns exist ──
        
        // Add 'location' if not exists (base column for geofence)
        if (!Schema::hasColumn('attendance_sessions', 'location')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->string('location')->nullable()->after('valid_until')
                    ->comment('Location name/address for the session');
            });
        }
        
        // Add 'status' if not exists
        if (!Schema::hasColumn('attendance_sessions', 'status')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->string('status')->default('active')->after('location')
                    ->comment('Session status: active, closed, cancelled');
            });
        }
        
        // Add 'notes' if not exists
        if (!Schema::hasColumn('attendance_sessions', 'notes')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('status')
                    ->comment('Additional notes for the session');
            });
        }
        
        // ── NOW: Add teacher-specific enhancements ──
        
        // QR Code field
        if (!Schema::hasColumn('attendance_sessions', 'qr_code')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->text('qr_code')->nullable()->after('notes')
                    ->comment('Base64 encoded QR data for student scanning');
            });
        }

        // Geofence fields
        if (!Schema::hasColumn('attendance_sessions', 'enable_geofence')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->boolean('enable_geofence')->default(false)->after('qr_code');
            });
        }
        if (!Schema::hasColumn('attendance_sessions', 'radius_meters')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->integer('radius_meters')->nullable()->after('enable_geofence')
                    ->comment('Geofence radius in meters');
            });
        }
        if (!Schema::hasColumn('attendance_sessions', 'center_lat')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->decimal('center_lat', 10, 8)->nullable()->after('radius_meters');
            });
        }
        if (!Schema::hasColumn('attendance_sessions', 'center_lng')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->decimal('center_lng', 11, 8)->nullable()->after('center_lat');
            });
        }

        // QR settings
        if (!Schema::hasColumn('attendance_sessions', 'qr_expiry_minutes')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->integer('qr_expiry_minutes')->default(30)->after('center_lng')
                    ->comment('QR code validity in minutes');
            });
        }
        if (!Schema::hasColumn('attendance_sessions', 'max_uses')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->integer('max_uses')->nullable()->after('qr_expiry_minutes')
                    ->comment('Maximum number of times QR can be used');
            });
        }
        if (!Schema::hasColumn('attendance_sessions', 'uses_count')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->integer('uses_count')->default(0)->after('max_uses');
            });
        }

        // Session metadata (JSON)
        if (!Schema::hasColumn('attendance_sessions', 'metadata')) {
            Schema::table('attendance_sessions', function (Blueprint $table) {
                $table->json('metadata')->nullable()->after('uses_count')
                    ->comment('Additional session configuration');
            });
        }
        
        // Add indexes for performance
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $this->addIndexIfExists($table, 'attendance_sessions', ['date', 'status'], 'attendance_sessions_date_status_idx');
            $this->addIndexIfExists($table, 'attendance_sessions', ['subject_id', 'date'], 'attendance_sessions_subject_date_idx');
        });

        // ═══════════════════════════════════════════════════════════
        // PERMISSIONS TABLE
        // ═══════════════════════════════════════════════════════════
        
        // Ensure base columns exist
        if (!Schema::hasColumn('permissions', 'status')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->string('status')->default('pending')->after('reason')
                    ->comment('Permission status: pending, approved, rejected');
            });
        }
        if (!Schema::hasColumn('permissions', 'attachment_url')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->string('attachment_url')->nullable()->after('status')
                    ->comment('URL to attached document/image');
            });
        }
        
        // Approval tracking
        if (!Schema::hasColumn('permissions', 'approved_by')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->foreignId('approved_by')->nullable()->after('attachment_url')
                    ->constrained('users')->nullOnDelete()
                    ->comment('Teacher who approved/rejected this permission');
            });
        }
        if (!Schema::hasColumn('permissions', 'approved_at')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->timestamp('approved_at')->nullable()->after('approved_by');
            });
        }
        if (!Schema::hasColumn('permissions', 'approval_note')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->text('approval_note')->nullable()->after('approved_at')
                    ->comment('Note from teacher for approval/rejection');
            });
        }

        // Attachment handling (server-side)
        if (!Schema::hasColumn('permissions', 'attachment_path')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->string('attachment_path')->nullable()->after('approval_note');
            });
        }
        if (!Schema::hasColumn('permissions', 'attachment_mime')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->string('attachment_mime')->nullable()->after('attachment_path');
            });
        }
        if (!Schema::hasColumn('permissions', 'attachment_size')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->integer('attachment_size')->nullable()->after('attachment_mime');
            });
        }

        // Notification preferences
        if (!Schema::hasColumn('permissions', 'notify_parent')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->boolean('notify_parent')->default(false)->after('attachment_size');
            });
        }
        if (!Schema::hasColumn('permissions', 'notify_student')) {
            Schema::table('permissions', function (Blueprint $table) {
                $table->boolean('notify_student')->default(true)->after('notify_parent');
            });
        }
        
        // Indexes
        Schema::table('permissions', function (Blueprint $table) {
            $this->addIndexIfExists($table, 'permissions', ['status', 'date_from'], 'permissions_status_date_idx');
            $this->addIndexIfExists($table, 'permissions', ['student_id', 'status'], 'permissions_student_status_idx');
        });

        // ═══════════════════════════════════════════════════════════
        // ATTENDANCES TABLE (student check-in records)
        // ═══════════════════════════════════════════════════════════
        
        // Ensure base columns
        if (!Schema::hasColumn('attendances', 'status')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->string('status')->default('Hadir')->after('user_id')
                    ->comment('Attendance status: Hadir, Terlambat, Izin, Sakit, Alpha');
            });
        }
        if (!Schema::hasColumn('attendances', 'check_in_time')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->time('check_in_time')->nullable()->after('status');
            });
        }
        if (!Schema::hasColumn('attendances', 'check_out_time')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->time('check_out_time')->nullable()->after('check_in_time');
            });
        }
        if (!Schema::hasColumn('attendances', 'location_string')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->string('location_string')->nullable()->after('check_out_time')
                    ->comment('Human-readable location name');
            });
        }
        
        // Verification metadata
        if (!Schema::hasColumn('attendances', 'verified_by')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->foreignId('verified_by')->nullable()->after('location_string')
                    ->constrained('users')->nullOnDelete()
                    ->comment('Teacher who manually verified this attendance');
            });
        }
        if (!Schema::hasColumn('attendances', 'verified_at')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->timestamp('verified_at')->nullable()->after('verified_by');
            });
        }
        if (!Schema::hasColumn('attendances', 'verification_note')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->text('verification_note')->nullable()->after('verified_at');
            });
        }

        // Location verification
        if (!Schema::hasColumn('attendances', 'location_verified')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->boolean('location_verified')->default(false)->after('verification_note');
            });
        }
        if (!Schema::hasColumn('attendances', 'accuracy_meters')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->decimal('accuracy_meters', 8, 2)->nullable()->after('location_verified');
            });
        }
        if (!Schema::hasColumn('attendances', 'device_info')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->string('device_info')->nullable()->after('accuracy_meters')
                    ->comment('Device model, OS, app version for fraud detection');
            });
        }
        
        // Indexes
        Schema::table('attendances', function (Blueprint $table) {
            $this->addIndexIfExists($table, 'attendances', ['user_id', 'date'], 'attendances_user_date_idx');
            $this->addIndexIfExists($table, 'attendances', ['session_id', 'status'], 'attendances_session_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes first
        $this->dropIndexIfExists('attendance_sessions', 'attendance_sessions_date_status_idx');
        $this->dropIndexIfExists('attendance_sessions', 'attendance_sessions_subject_date_idx');
        $this->dropIndexIfExists('permissions', 'permissions_status_date_idx');
        $this->dropIndexIfExists('permissions', 'permissions_student_status_idx');
        $this->dropIndexIfExists('attendances', 'attendances_user_date_idx');
        $this->dropIndexIfExists('attendances', 'attendances_session_status_idx');

        // Remove teacher-specific columns (only the ones we added)
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $columns = ['qr_code', 'enable_geofence', 'radius_meters', 'center_lat', 'center_lng', 
                       'qr_expiry_minutes', 'max_uses', 'uses_count', 'metadata'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('attendance_sessions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('permissions', function (Blueprint $table) {
            $columns = ['approved_by', 'approved_at', 'approval_note', 'attachment_path', 
                       'attachment_mime', 'attachment_size', 'notify_parent', 'notify_student'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('permissions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            $columns = ['verified_by', 'verified_at', 'verification_note', 'location_verified', 
                       'accuracy_meters', 'device_info'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('attendances', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    /**
     * Helper: Add index only if it doesn't exist AND columns exist
     */
    private function addIndexIfExists(Blueprint $table, string $tableName, array $columns, string $indexName): void
    {
        // Verify all index columns exist in the database table
        foreach ($columns as $column) {
            if (!Schema::hasColumn($tableName, $column)) {
                return; // Skip index creation if any column does not exist
            }
        }

        $indexExists = $this->doesIndexExist($tableName, $indexName);

        if (!$indexExists) {
            $table->index($columns, $indexName);
        }
    }

    /**
     * Helper: Drop index only if it exists
     */
    private function dropIndexIfExists(string $tableName, string $indexName): void
    {
        if ($this->doesIndexExist($tableName, $indexName)) {
            Schema::table($tableName, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        }
    }

    private function doesIndexExist(string $tableName, string $indexName): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$tableName}')");
            return collect($indexes)->contains(fn ($index) => ($index->name ?? $index['name'] ?? null) === $indexName);
        }

        if ($driver === 'mysql') {
            $indexExists = DB::selectOne("
                SELECT COUNT(*) as count 
                FROM information_schema.statistics 
                WHERE table_schema = DATABASE() 
                AND table_name = ? 
                AND index_name = ?
            ", [$tableName, $indexName]);

            return $indexExists && $indexExists->count > 0;
        }

        return false;
    }
};