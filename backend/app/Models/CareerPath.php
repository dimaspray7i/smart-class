<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class CareerPath extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'icon',
        'color',
        'required_skills',
        'career_outcomes',
        'is_active',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'required_skills' => 'array',
            'career_outcomes' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Boot model untuk auto-generate slug
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($path) {
            if (empty($path->slug)) {
                $path->slug = \Illuminate\Support\Str::slug($path->title);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * CareerPath has many simulator steps
     */
    public function steps(): HasMany
    {
        return $this->hasMany(SimulatorStep::class)->orderBy('order');
    }

    /**
     * CareerPath has many simulator sessions
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(SimulatorSession::class);
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Active paths only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Search by title or description
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('title', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get steps count
     */
    public function getStepsCountAttribute(): int
    {
        return $this->steps()->count();
    }

    /**
     * Accessor: Get sessions count
     */
    public function getSessionsCountAttribute(): int
    {
        return $this->sessions()->count();
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get first step
     */
    public function getFirstStep(): ?SimulatorStep
    {
        return $this->steps()->orderBy('order')->first();
    }

    /**
     * Get final step
     */
    public function getFinalStep(): ?SimulatorStep
    {
        return $this->steps()->where('is_final', true)->first();
    }

    /**
     * Check if path is complete (has final step)
     */
    public function getIsCompleteAttribute(): bool
    {
        return $this->steps()->where('is_final', true)->exists();
    }
}