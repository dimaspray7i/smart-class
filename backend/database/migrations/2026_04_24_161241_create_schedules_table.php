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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke classes
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            
            // Foreign key ke subjects
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            
            // Foreign key ke users (guru)
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            
            // Hari (senin, selasa, rabu, kamis, jumat, sabtu)
            $table->enum('day', ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu']);
            
            // Waktu mulai
            $table->time('start_time');
            
            // Waktu selesai
            $table->time('end_time');
            
            // Ruang kelas
            $table->string('room')->nullable();
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Composite unique constraint (prevent double booking)
            $table->unique(['class_id', 'teacher_id', 'day', 'start_time']);
            
            // Index untuk query performance
            $table->index('day');
            $table->index('start_time');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};