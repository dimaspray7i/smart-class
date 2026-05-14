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
        // Add pkl_location_id to users table (students assigned to a location)
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('pkl_location_id')
                ->nullable()
                ->after('is_active')
                ->constrained('pkl_locations')
                ->nullOnDelete();
        });

        // Add major to profiles table
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('major', 50)->nullable()->after('class_level')->comment('Jurusan (e.g. RPL, TKJ)');
            $table->index('major');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['pkl_location_id']);
            $table->dropColumn('pkl_location_id');
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('major');
        });
    }
};
