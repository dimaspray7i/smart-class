<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates pivot table for many-to-many relationship between classes and subjects.
     * Used for assigning subjects to specific classes.
     */
    public function up(): void
    {
        Schema::create('class_subject', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to classes table
            $table->foreignId('class_model_id')
                ->constrained('classes')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Foreign key to subjects table
            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Optional: Academic year for subject assignment
            $table->string('academic_year', 9)->nullable()->comment('Format: 2024/2025');
            
            // Optional: Is this subject active for this class?
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            // Composite unique constraint to prevent duplicate assignments
            $table->unique(['class_model_id', 'subject_id'], 'class_subject_unique');
            
            // Indexes for faster queries
            $table->index('class_model_id', 'idx_class_subject_class');
            $table->index('subject_id', 'idx_class_subject_subject');
            $table->index('academic_year', 'idx_class_subject_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('class_subject');
    }
};