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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke users table
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // NIS untuk siswa (nullable untuk guru/admin)
            $table->string('nis', 20)->unique()->nullable();
            
            // NIP untuk guru (nullable untuk siswa/admin)
            $table->string('nip', 20)->unique()->nullable();
            
            // Tingkat kelas (X, XI, XII)
            $table->enum('class_level', ['X', 'XI', 'XII'])->nullable();
            
            // Bio/deskripsi singkat
            $table->text('bio')->nullable();
            
            // Link GitHub
            $table->string('github_url')->nullable();
            
            // Link LinkedIn
            $table->string('linkedin_url')->nullable();
            
            // Preferensi user (JSON)
            $table->json('preferences')->nullable();
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('user_id');
            $table->index('nis');
            $table->index('nip');
            $table->index('class_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};