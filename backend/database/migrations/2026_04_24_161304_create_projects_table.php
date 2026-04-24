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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke users (pemilik project)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Judul project
            $table->string('title');
            
            // Slug untuk URL friendly
            $table->string('slug')->unique();
            
            // Deskripsi project
            $table->text('description');
            
            // URL repository (GitHub, GitLab, dll)
            $table->string('repository_url')->nullable();
            
            // URL demo/live
            $table->string('demo_url')->nullable();
            
            // Status project
            $table->enum('status', ['planning', 'in_progress', 'review', 'completed', 'archived'])->default('planning');
            
            // Tanggal mulai
            $table->date('start_date')->nullable();
            
            // Tanggal selesai
            $table->date('end_date')->nullable();
            
            // Tags (JSON array)
            $table->json('tags')->nullable();
            
            // Visibility (1=public, 0=private)
            $table->boolean('visibility')->default(1);
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('user_id');
            $table->index('status');
            $table->index('slug');
            $table->index('visibility');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};