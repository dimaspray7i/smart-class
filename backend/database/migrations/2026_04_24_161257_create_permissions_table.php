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
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            
            // Foreign key ke users (siswa yang mengajukan)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Foreign key ke users (guru yang approve)
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            
            // Tanggal mulai izin
            $table->date('date_from');
            
            // Tanggal selesai izin
            $table->date('date_to');
            
            // Tipe izin (Izin, Sakit)
            $table->enum('type', ['Izin', 'Sakit']);
            
            // Alasan
            $table->text('reason');
            
            // URL attachment (surat dokter, dll)
            $table->string('attachment_url')->nullable();
            
            // Status approval
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            
            // Catatan dari guru
            $table->text('note')->nullable();
            
            // Waktu approval
            $table->timestamp('approved_at')->nullable();
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('user_id');
            $table->index('teacher_id');
            $table->index('status');
            $table->index(['date_from', 'date_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permissions');
    }
};