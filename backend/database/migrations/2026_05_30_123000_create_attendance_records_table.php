<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('attendance_session_id')->nullable()->constrained('attendance_sessions')->nullOnDelete();
            $table->string('verification_code', 20)->nullable();
            $table->boolean('face_verified')->default(false);
            $table->unsignedTinyInteger('face_score')->default(0);
            $table->string('selfie_photo')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->unsignedSmallInteger('accuracy')->nullable();
            $table->unsignedSmallInteger('distance_from_school')->nullable();
            $table->boolean('location_verified')->default(false);
            $table->string('device_info', 255)->nullable();
            $table->string('browser_info', 255)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->enum('status', ['pending', 'face_verified', 'location_verified', 'completed', 'failed'])->default('pending');
            $table->timestamps();

            $table->index(['student_id', 'attendance_session_id']);
            $table->index(['verification_code']);
            $table->index(['status']);
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
