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
        Schema::create('student_skills', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Foreign key ke skills
            $table->foreignId('skill_id')->constrained('skills')->onDelete('cascade');
            
            // Level skill (0-100)
            $table->integer('level')->default(0);
            
            // Total jam praktik
            $table->integer('hours_practiced')->default(0);
            
            // Waktu terakhir praktik
            $table->timestamp('last_practiced_at')->nullable();
            
            // Bukti/evidence (JSON array)
            $table->json('evidence')->nullable();
            
            $table->timestamps();
            
            // Composite unique constraint
            $table->unique(['user_id', 'skill_id']);
            
            // Index untuk query performance
            $table->index('user_id');
            $table->index('skill_id');
            $table->index('level');
            $table->index('last_practiced_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_skills');
    }
};