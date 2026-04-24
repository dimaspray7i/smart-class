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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            
            // Kode mapel (contoh: RPL-101)
            $table->string('code')->unique();
            
            // Nama mapel
            $table->string('name');
            
            // Kategori (productive, normative, adaptive)
            $table->enum('category', ['productive', 'normative', 'adaptive']);
            
            // Jumlah kredit/jam
            $table->integer('credits')->default(4);
            
            // Deskripsi mapel
            $table->text('description')->nullable();
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Index untuk query performance
            $table->index('category');
            $table->index('is_active');
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};