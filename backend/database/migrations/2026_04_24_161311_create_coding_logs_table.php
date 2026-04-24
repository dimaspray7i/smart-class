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
        Schema::create('coding_logs', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke projects
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            
            // Foreign key ke users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Commit hash (Git)
            $table->string('commit_hash')->nullable();
            
            // Branch name
            $table->string('branch_name')->default('main');
            
            // Deskripsi perubahan
            $table->text('description');
            
            // Jumlah baris ditambah
            $table->integer('lines_added')->nullable();
            
            // Jumlah baris dihapus
            $table->integer('lines_deleted')->nullable();
            
            // File yang diubah (JSON array)
            $table->json('files_changed')->nullable();
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('project_id');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coding_logs');
    }
};