<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSkill extends Pivot
{
    use HasFactory;

    /**
     * Table name
     */
    protected $table = 'student_skills';

    /**
     * Indicates if the IDs are auto-incrementing
     */
    public $incrementing = true;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'user_id',
        'skill_id',
        'level',
        'hours_practiced',
        'last_practiced_at',
        'evidence',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'hours_practiced' => 'integer',
            'last_practiced_at' => 'datetime',
            'evidence' => 'array',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * StudentSkill belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * StudentSkill belongs to a skill
     */
    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by level range
     */
    public function scopeLevelRange($query, int $min, int $max)
    {
        return $query->whereBetween('level', [$min, $max]);
    }

    /**
     * Scope: Mastered skills (level >= 80)
     */
    public function scopeMastered($query)
    {
        return $query->where('level', '>=', 80);
    }

    /**
     * Scope: Learning skills (level < 80)
     */
    public function scopeLearning($query)
    {
        return $query->where('level', '<', 80);
    }

    /**
     * Scope: Recently practiced (last 30 days)
     */
    public function scopeRecentlyPracticed($query)
    {
        return $query->where('last_practiced_at', '>=', now()->subDays(30));
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get level label
     */
    public function getLevelLabelAttribute(): string
    {
        if ($this->level >= 80) {
            return 'Master';
        } elseif ($this->level >= 60) {
            return 'Advanced';
        } elseif ($this->level >= 40) {
            return 'Intermediate';
        } elseif ($this->level >= 20) {
            return 'Beginner';
        } else {
            return 'Novice';
        }
    }

    /**
     * Accessor: Get level color
     */
    public function getLevelColorAttribute(): string
    {
        if ($this->level >= 80) {
            return 'green';
        } elseif ($this->level >= 60) {
            return 'blue';
        } elseif ($this->level >= 40) {
            return 'yellow';
        } else {
            return 'gray';
        }
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Add hours to skill
     */
    public function addHours(int $hours): void
    {
        $levelIncrease = $hours * 5; // 5% per hour
        $newLevel = min($this->level + $levelIncrease, 100);

        $this->update([
            'hours_practiced' => $this->hours_practiced + $hours,
            'level' => $newLevel,
            'last_practiced_at' => now(),
        ]);
    }

    /**
     * Add evidence
     */
    public function addEvidence(string $evidence): void
    {
        $evidences = $this->evidence ?? [];
        $evidences[] = $evidence;
        $this->update(['evidence' => $evidences]);
    }

    /**
     * Check if skill is mastered
     */
    public function isMastered(): bool
    {
        return $this->level >= 80;
    }
}