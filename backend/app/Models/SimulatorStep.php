<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SimulatorStep extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'career_path_id',
        'title',
        'content',
        'order',
        'is_final',
        'options',
        'metadata',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'is_final' => 'boolean',
            'options' => 'array',
            'metadata' => 'array',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * SimulatorStep belongs to a career path
     */
    public function careerPath(): BelongsTo
    {
        return $this->belongsTo(CareerPath::class);
    }

    /**
     * SimulatorStep has many sessions (as current step)
     */
    public function currentSessions(): HasMany
    {
        return $this->hasMany(SimulatorSession::class, 'current_step_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: For specific career path
     */
    public function scopeForPath($query, int $pathId)
    {
        return $query->where('career_path_id', $pathId);
    }

    /**
     * Scope: Final step only
     */
    public function scopeFinal($query)
    {
        return $query->where('is_final', true);
    }

    /**
     * Scope: Order by sequence
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order');
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get options count
     */
    public function getOptionsCountAttribute(): int
    {
        return is_array($this->options) ? count($this->options) : 0;
    }

    /**
     * Accessor: Check if step has choices
     */
    public function getHasChoicesAttribute(): bool
    {
        return $this->options_count > 0;
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Get next step
     */
    public function getNextStep(?string $choiceKey = null): ?SimulatorStep
    {
        if ($choiceKey && isset($this->options[$choiceKey])) {
            $nextStepId = $this->options[$choiceKey]['next_step_id'] ?? null;
            
            if ($nextStepId) {
                return self::find($nextStepId);
            }
        }

        // Default: get next step by order
        return self::where('career_path_id', $this->career_path_id)
            ->where('order', '>', $this->order)
            ->orderBy('order')
            ->first();
    }

    /**
     * Check if choice is valid
     */
    public function isValidChoice(string $choiceKey): bool
    {
        return isset($this->options[$choiceKey]);
    }

    /**
     * Get choice data
     */
    public function getChoiceData(string $choiceKey): ?array
    {
        return $this->options[$choiceKey] ?? null;
    }
}