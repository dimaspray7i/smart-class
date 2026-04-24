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
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            
            // Nama skill
            $table->string('name');
            
            // Slug untuk URL friendly
            $table->string('slug')->unique();
            
            // Kategori skill
            $table->enum('category', ['frontend', 'backend', 'database', 'devops', 'soft_skill']);
            
            // Deskripsi skill
            $table->text('description')->nullable();
            
            // Icon (emoji atau class)
            $table->string('icon')->nullable();
            
            // Max level (default 100%)
            $table->integer('max_level')->default(100);
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('category');
            $table->index('is_active');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};