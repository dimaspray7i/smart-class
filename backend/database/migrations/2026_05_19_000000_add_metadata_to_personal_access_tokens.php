<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            if (!Schema::hasColumn('personal_access_tokens', 'device_info')) {
                $table->json('device_info')->nullable()->after('abilities');
            }
            if (!Schema::hasColumn('personal_access_tokens', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('device_info');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('personal_access_tokens', 'device_info')) {
                $table->dropColumn('device_info');
            }
            if (Schema::hasColumn('personal_access_tokens', 'expires_at')) {
                $table->dropColumn('expires_at');
            }
        });
    }
};
