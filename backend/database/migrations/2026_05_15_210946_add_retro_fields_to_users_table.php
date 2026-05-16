<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 2FA fields
            if (!Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('users', 'two_factor_method')) {
                $table->string('two_factor_method')->nullable()->after('two_factor_enabled');
            }
            if (!Schema::hasColumn('users', 'two_factor_secret')) {
                $table->string('two_factor_secret')->nullable()->after('two_factor_method');
            }
            
            // Login tracking
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('email_verified_at');
            }
            if (!Schema::hasColumn('users', 'last_login_ip')) {
                $table->string('last_login_ip')->nullable()->after('last_login_at');
            }
            
            // Retro preferences (JSON)
            if (!Schema::hasColumn('users', 'theme_preferences')) {
                $table->json('theme_preferences')->nullable()->after('avatar_url');
            }
            if (!Schema::hasColumn('users', 'notification_preferences')) {
                $table->json('notification_preferences')->nullable()->after('theme_preferences');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_enabled',
                'two_factor_method',
                'two_factor_secret',
                'last_login_at',
                'last_login_ip',
                'theme_preferences',
                'notification_preferences',
            ]);
        });
    }
};