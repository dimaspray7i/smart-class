<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Make teacher_id nullable in permissions table
     * so students can submit permissions even if no wali kelas assigned.
     */
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['teacher_id']);

            // Modify teacher_id to nullable
            $table->foreignId('teacher_id')
                ->nullable()
                ->change();

            // Re-add foreign key constraint with nullable support
            $table->foreign('teacher_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropForeign(['teacher_id']);

            $table->foreignId('teacher_id')
                ->nullable(false)
                ->change();

            $table->foreign('teacher_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }
};
