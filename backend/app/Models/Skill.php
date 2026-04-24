<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'name',
        'slug',
        'category',
        'description',
        'icon',
        'max_level',
        'is_active',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'max_level' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Boot model untuk auto-generate slug
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($skill) {
            if (empty($skill->slug)) {
                $skill->slug = \Illuminate\Support\Str::slug($skill->name);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Skill belongs to many students (many-to-many)
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_skills')
            ->withPivot('level', 'hours_practiced', 'last_practiced_at', 'evidence')
            ->withTimestamps();
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by category
     */
    public function scopeCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Active skills only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Search by name
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get category label
     */
    public function getCategoryLabelAttribute(): string
    {
        $labels = [
            'frontend' => 'Frontend',
            'backend' => 'Backend',
            'database' => 'Database',
            'devops' => 'DevOps',
            'soft_skill' => 'Soft Skill',
        ];

        return $labels[$this->category] ?? $this->category;
    }

    /**
     * Accessor: Get students count learning this skill
     */
    public function getStudentsCountAttribute(): int
    {
        return $this->students()->count();
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get average level of students learning this skill
     */
    public function getAverageLevelAttribute(): float
    {
        return $this->students()
            ->avg('student_skills.level') ?? 0;
    }

    /**
     * Check if skill is popular (>10 students)
     */
    public function getIsPopularAttribute(): bool
    {
        return $this->students_count > 10;
    }
}