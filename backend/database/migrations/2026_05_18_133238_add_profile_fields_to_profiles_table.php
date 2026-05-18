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
        Schema::table('profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('profiles', 'address')) {
                $table->text('address')->nullable()->after('linkedin_url');
            }
            if (!Schema::hasColumn('profiles', 'gender')) {
                $table->enum('gender', ['L', 'P'])->nullable()->after('address');
            }
            if (!Schema::hasColumn('profiles', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('gender');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['address', 'gender', 'date_of_birth']);
        });
    }
};
