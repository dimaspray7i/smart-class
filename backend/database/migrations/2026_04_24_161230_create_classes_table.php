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
        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            
            // Nama kelas (contoh: RPL X-1)
            $table->string('name');
            
            // Tingkat kelas
            $table->enum('level', ['X', 'XI', 'XII']);
            
            // Slug untuk URL friendly
            $table->string('slug')->unique();
            
            // Deskripsi kelas
            $table->text('description')->nullable();
            
            // Kapasitas maksimal siswa
            $table->integer('capacity')->default(36);
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('level');
            $table->index('is_active');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};