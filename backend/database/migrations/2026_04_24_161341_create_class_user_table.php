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
        Schema::create('class_user', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke classes
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            
            // Foreign key ke users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Role dalam kelas (siswa, wali_kelas, guru_pengampu)
            $table->enum('role_in_class', ['siswa', 'wali_kelas', 'guru_pengampu'])->default('siswa');
            
            // Tahun akademik
            $table->year('academic_year')->default(2025);
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Composite unique constraint
            $table->unique(['class_id', 'user_id', 'academic_year']);
            
            // Index untuk query performance
            $table->index('user_id');
            $table->index('class_id');
            $table->index('academic_year');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_user');
    }
};