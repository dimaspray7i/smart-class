<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SimulatorSession extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'user_id',
        'career_path_id',
        'current_step_id',
        'choices',
        'completed_at',
        'result',
        'session_token',
        'expires_at',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'choices' => 'array',
            'result' => 'array',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Boot model untuk auto-generate token
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($session) {
            if (empty($session->session_token)) {
                $session->session_token = self::generateUniqueToken();
            }

            if (empty($session->expires_at)) {
                $session->expires_at = now()->addHours(
                    config('app.simulator_session_expire_hours', 24)
                );
            }
        });
    }

    /**
     * Generate unique session token
     */
    private static function generateUniqueToken(): string
    {
        do {
            $token = Str::random(32);
        } while (self::where('session_token', $token)->exists());

        return $token;
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Session belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Session belongs to a career path
     */
    public function careerPath(): BelongsTo
    {
        return $this->belongsTo(CareerPath::class);
    }

    /**
     * Session belongs to current step
     */
    public function currentStep(): BelongsTo
    {
        return $this->belongsTo(SimulatorStep::class, 'current_step_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Active sessions (not expired)
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>=', now())
            ->whereNull('completed_at');
    }

    /**
     * Scope: Completed sessions
     */
    public function scopeCompleted($query)
    {
        return $query->whereNotNull('completed_at');
    }

    /**
     * Scope: For specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: For specific career path
     */
    public function scopeForPath($query, int $pathId)
    {
        return $query->where('career_path_id', $pathId);
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Check if session is still valid
     */
    public function getIsValidAttribute(): bool
    {
        return $this->expires_at->isFuture() && !$this->completed_at;
    }

    /**
     * Accessor: Check if session is completed
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * Accessor: Get choices count
     */
    public function getChoicesCountAttribute(): int
    {
        return is_array($this->choices) ? count($this->choices) : 0;
    }

    /**
     * Accessor: Get progress percentage
     */
    public function getProgressAttribute(): int
    {
        $totalSteps = $this->careerPath?->steps()->count() ?? 1;
        return $totalSteps > 0 
            ? min(100, round(($this->choices_count / $totalSteps) * 100)) 
            : 0;
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Add choice to session
     */
    public function addChoice(string $stepTitle, string $choiceKey): void
    {
        $choices = $this->choices ?? [];
        $choices[] = [
            'step' => $stepTitle,
            'choice' => $choiceKey,
            'timestamp' => now()->toDateTimeString(),
        ];

        $this->update(['choices' => $choices]);
    }

    /**
     * Update current step
     */
    public function updateCurrentStep(int $stepId): void
    {
        $this->update(['current_step_id' => $stepId]);
    }

    /**
     * Complete session with result
     */
    public function complete(array $result): void
    {
        $this->update([
            'completed_at' => now(),
            'result' => $result,
        ]);
    }

    /**
     * Expire session manually
     */
    public function expire(): void
    {
        $this->update(['expires_at' => now()->subMinute()]);
    }

    /**
     * Extend session
     */
    public function extendHours(int $hours): void
    {
        $this->update([
            'expires_at' => $this->expires_at->addHours($hours),
        ]);
    }

    /**
     * Get choice history
     */
    public function getChoiceHistory(): array
    {
        return $this->choices ?? [];
    }
}