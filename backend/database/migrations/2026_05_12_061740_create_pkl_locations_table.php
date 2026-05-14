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
        Schema::create('pkl_locations', function (Blueprint $table) {
            $table->id();
            
            // Company Information
            $table->string('company_name', 255);
            $table->text('address');
            
            // GPS Coordinates
            $table->decimal('latitude', 10, 8)->comment('Latitude coordinate (-90 to 90)');
            $table->decimal('longitude', 11, 8)->comment('Longitude coordinate (-180 to 180)');
            
            // Attendance Settings
            $table->unsignedInteger('radius_meters')->default(100)->comment('Absensi radius in meters');
            
            // Supervisor Information
            $table->string('supervisor_name', 255)->nullable();
            $table->string('supervisor_phone', 20)->nullable();
            $table->string('supervisor_email', 255)->nullable();
            
            // Notes & Metadata
            $table->text('notes')->nullable();
            
            // Approval Workflow
            $table->boolean('is_approved')->default(false)->index();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true)->index();
            
            // Timestamps
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['latitude', 'longitude'], 'idx_pkl_location_coords');
            $table->index(['is_approved', 'is_active'], 'idx_pkl_status');
            
            // Optional: Add spatial index for MySQL (if using MySQL 5.7+)
            // $table->spatialIndex(['latitude', 'longitude']);
        });

        // Add foreign key to attendance table for PKL location tracking
        Schema::table('attendances', function (Blueprint $table) {
            $table->foreignId('pkl_location_id')
                ->nullable()
                ->constrained('pkl_locations')
                ->nullOnDelete()
                ->after('verification_method');
            
            $table->string('location_name', 255)
                ->nullable()
                ->after('pkl_location_id')
                ->comment('Cached company name for display');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove columns from attendances table first
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['pkl_location_id']);
            $table->dropColumn(['pkl_location_id', 'location_name']);
        });

        // Drop PKL locations table
        Schema::dropIfExists('pkl_locations');
    }
};