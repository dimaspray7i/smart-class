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
        Schema::create('career_paths', function (Blueprint $table) {
            $table->id();
            
            // Judul jalur karir
            $table->string('title');
            
            // Slug untuk URL friendly
            $table->string('slug')->unique();
            
            // Deskripsi jalur karir
            $table->text('description');
            
            // Icon (emoji atau class)
            $table->string('icon')->nullable();
            
            // Warna tema
            $table->string('color')->default('#3b82f6');
            
            // Skill yang diperlukan (JSON array)
            $table->json('required_skills')->nullable();
            
            // Outcome karir (JSON array)
            $table->json('career_outcomes')->nullable();
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('slug');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('career_paths');
    }
};