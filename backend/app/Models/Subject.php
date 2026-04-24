<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'code',
        'name',
        'category',
        'credits',
        'description',
        'is_active',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'credits' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Subject has many schedules
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
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
     * Scope: Active subjects only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Search by name or code
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('name', 'like', "%{$search}%")
            ->orWhere('code', 'like', "%{$search}%");
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
            'productive' => 'Produktif',
            'normative' => 'Normatif',
            'adaptive' => 'Adaptif',
        ];

        return $labels[$this->category] ?? $this->category;
    }

    /**
     * Accessor: Get full subject name with code
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->code} - {$this->name}";
    }
}