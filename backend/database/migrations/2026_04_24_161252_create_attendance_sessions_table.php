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
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            
            // Kode absensi (6 karakter uppercase, unique)
            $table->string('code', 10)->unique();
            
            // Foreign key ke classes
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            
            // Foreign key ke users (guru yang generate)
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            
            // Waktu mulai valid (gunakan dateTime instead of timestamp)
            $table->dateTime('valid_from');
            
            // Waktu berakhir valid (gunakan dateTime instead of timestamp)
            $table->dateTime('valid_until');
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            // Maksimal penggunaan (null = unlimited)
            $table->integer('max_uses')->nullable();
            
            // Jumlah penggunaan saat ini
            $table->integer('used_count')->default(0);
            
            // Radius dalam meter
            $table->decimal('radius_meters', 8, 2)->default(100);
            
            // Titik tengah lokasi (latitude)
            $table->decimal('center_lat', 10, 8)->nullable();
            
            // Titik tengah lokasi (longitude)
            $table->decimal('center_lng', 11, 8)->nullable();
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('code');
            $table->index('is_active');
            $table->index(['valid_from', 'valid_until']);
            $table->index('class_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};