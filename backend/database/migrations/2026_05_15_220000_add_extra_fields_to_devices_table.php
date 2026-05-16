<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            if (!Schema::hasColumn('devices', 'is_trusted')) {
                $table->boolean('is_trusted')->default(false)->after('last_used_at');
            }
            if (!Schema::hasColumn('devices', 'retro_theme_enabled')) {
                $table->boolean('retro_theme_enabled')->default(true)->after('is_trusted');
            }
            
            // Add index if not exists
            $table->index(['ip_address']);
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropIndex(['ip_address']);
            $table->dropColumn(['is_trusted', 'retro_theme_enabled']);
        });
    }
};
