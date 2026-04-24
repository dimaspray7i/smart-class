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
        Schema::create('simulator_sessions', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke users (nullable untuk public)
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            
            // Foreign key ke career_paths
            $table->foreignId('career_path_id')->constrained('career_paths')->onDelete('cascade');
            
            // Foreign key ke simulator_steps (step saat ini)
            $table->foreignId('current_step_id')->constrained('simulator_steps')->onDelete('cascade');
            
            // History pilihan (JSON array)
            $table->json('choices')->nullable();
            
            // Waktu selesai
            $table->timestamp('completed_at')->nullable();
            
            // Hasil akhir (JSON)
            $table->json('result')->nullable();
            
            // Token sesi (unique)
            $table->string('session_token')->unique();
            
            // Waktu kadaluarsa - FIXED: tambahkan default value
            $table->timestamp('expires_at')->nullable();
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('session_token');
            $table->index('expires_at');
            $table->index('user_id');
            $table->index('career_path_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulator_sessions');
    }
};