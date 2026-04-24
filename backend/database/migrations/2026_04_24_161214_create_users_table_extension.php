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
        Schema::table('users', function (Blueprint $table) {
            // Role user (admin, guru, siswa)
            $table->enum('role', ['admin', 'guru', 'siswa'])->default('siswa')->after('email');
            
            // Slug untuk URL friendly
            $table->string('slug')->unique()->nullable()->after('name');
            
            // Nomor telepon
            $table->string('phone', 20)->nullable()->after('email');
            
            // URL avatar/foto profil
            $table->string('avatar_url')->nullable()->after('phone');
            
            // Status aktif/non-aktif
            $table->boolean('is_active')->default(true)->after('role');
            
            // Waktu login terakhir
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            
            // Index untuk performance
            $table->index('role');
            $table->index('is_active');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['role']);
            $table->dropIndex(['is_active']);
            $table->dropIndex(['slug']);
            
            // Drop columns (HANYA yang kita tambah)
            $table->dropColumn([
                'role',
                'slug',
                'phone',
                'avatar_url',
                'is_active',
                'last_login_at'
            ]);
            
            // JANGAN drop email_verified_at & remember_token (milik Laravel default)
        });
    }
};