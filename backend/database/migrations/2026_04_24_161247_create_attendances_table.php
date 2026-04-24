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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Tanggal absensi (YYYY-MM-DD)
            $table->date('date');
            
            // Latitude lokasi
            $table->decimal('lat', 10, 8)->nullable();
            
            // Longitude lokasi
            $table->decimal('lng', 11, 8)->nullable();
            
            // Status kehadiran
            $table->enum('status', ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'])->default('Alpha');
            
            // URL foto selfie
            $table->string('photo_url')->nullable();
            
            // Kode absensi yang digunakan
            $table->string('code_used', 10)->nullable();
            
            // Device info (web, android, ios)
            $table->string('device_info', 50)->default('web');
            
            // Metode verifikasi (auto, manual)
            $table->enum('verification_method', ['auto', 'manual'])->default('auto');
            
            // Catatan tambahan
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // CRITICAL: 1 user hanya bisa absen 1x per hari
            $table->unique(['user_id', 'date']);
            
            // Index untuk query performance
            $table->index('date');
            $table->index('status');
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'date', 'status']);
            $table->index(['lat', 'lng']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};