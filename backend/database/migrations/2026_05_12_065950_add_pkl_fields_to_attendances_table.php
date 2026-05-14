<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'pkl_location_id')) {
                $table->foreignId('pkl_location_id')
                    ->nullable()
                    ->constrained('pkl_locations')
                    ->nullOnDelete()
                    ->after('verification_method');
            }
            
            if (!Schema::hasColumn('attendances', 'location_name')) {
                $table->string('location_name', 255)
                    ->nullable()
                    ->comment('Cached company name for display')
                    ->after('pkl_location_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['pkl_location_id']);
            $table->dropColumn(['pkl_location_id', 'location_name']);
        });
    }
};