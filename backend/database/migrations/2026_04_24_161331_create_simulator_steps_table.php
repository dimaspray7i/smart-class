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
        Schema::create('simulator_steps', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke career_paths
            $table->foreignId('career_path_id')->constrained('career_paths')->onDelete('cascade');
            
            // Judul step
            $table->string('title');
            
            // Konten/deskripsi step
            $table->text('content');
            
            // Urutan step
            $table->integer('order')->default(0);
            
            // Apakah ini step final
            $table->boolean('is_final')->default(false);
            
            // Pilihan/opsi branching (JSON)
            $table->json('options')->nullable();
            
            // Metadata tambahan (JSON)
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('career_path_id');
            $table->index('order');
            $table->index('is_final');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulator_steps');
    }
};