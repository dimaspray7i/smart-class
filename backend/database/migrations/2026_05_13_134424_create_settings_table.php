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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->comment('Setting key (e.g., general_app_name)');
            $table->text('value')->nullable()->comment('Setting value (stored as string)');
            $table->string('section')->nullable()->index()->comment('Section grouping (general, attendance, etc.)');
            $table->string('type')->default('string')->comment('Data type: string, boolean, integer, json');
            $table->text('description')->nullable()->comment('Setting description for admin UI');
            $table->boolean('is_public')->default(false)->comment('Accessible via public API');
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['key', 'section']);
            $table->index('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};