<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class AttendanceSession extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'code',
        'class_id',
        'generated_by',
        'valid_from',
        'valid_until',
        'is_active',
        'max_uses',
        'used_count',
        'radius_meters',
        'center_lat',
        'center_lng',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
            'is_active' => 'boolean',
            'radius_meters' => 'float',
            'center_lat' => 'float',
            'center_lng' => 'float',
            'max_uses' => 'integer',
            'used_count' => 'integer',
        ];
    }

    /**
     * Boot model untuk auto-generate code
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($session) {
            if (empty($session->code)) {
                $session->code = self::generateUniqueCode();
            }

            if (empty($session->valid_from)) {
                $session->valid_from = now();
            }

            if (empty($session->valid_until)) {
                $session->valid_until = now()->addMinutes(
                    config('app.attendance_code_duration_minutes', 10)
                );
            }
        });
    }

    /**
     * Generate unique 6-character code
     */
    private static function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(\Illuminate\Support\Str::random(6));
        } while (self::where('code', $code)->exists());

        return $code;
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Session belongs to a class
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    /**
     * Session belongs to a teacher (generated_by)
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Session has many attendances
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'code_used', 'code');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Active sessions only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('valid_from', '<=', now())
            ->where('valid_until', '>=', now());
    }

    /**
     * Scope: Valid code
     */
    public function scopeValidCode($query, string $code)
    {
        return $query->where('code', strtoupper($code))->active();
    }

    /**
     * Scope: For specific class
     */
    public function scopeForClass($query, int $classId)
    {
        return $query->where('class_id', $classId);
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Check if session is currently valid
     */
    public function getIsValidAttribute(): bool
    {
        return $this->is_active
            && $this->valid_from->lte(now())
            && $this->valid_until->gte(now())
            && ($this->max_uses === null || $this->used_count < $this->max_uses);
    }

    /**
     * Accessor: Get remaining time in human readable format
     */
    public function getRemainingTimeAttribute(): string
    {
        if (!$this->is_valid) {
            return 'Expired';
        }

        return $this->valid_until->diffForHumans();
    }

    /**
     * Accessor: Get remaining uses
     */
    public function getRemainingUsesAttribute(): ?int
    {
        if ($this->max_uses === null) {
            return null; // Unlimited
        }

        return max(0, $this->max_uses - $this->used_count);
    }

    /**
     * Accessor: Get center location as array
     */
    public function getCenterLocationAttribute(): ?array
    {
        if (!$this->center_lat || !$this->center_lng) {
            return null;
        }

        return [
            'lat' => $this->center_lat,
            'lng' => $this->center_lng,
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Increment usage counter
     */
    public function incrementUsage(): bool
    {
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        $this->increment('used_count');

        // Auto-deactivate if max uses reached
        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            $this->update(['is_active' => false]);
        }

        return true;
    }

    /**
     * Close session manually
     */
    public function close(): void
    {
        $this->update(['is_active' => false]);
    }

    /**
     * Extend session validity
     */
    public function extendMinutes(int $minutes): void
    {
        $this->update([
            'valid_until' => $this->valid_until->addMinutes($minutes),
        ]);
    }

    /**
     * Check if code matches (case-insensitive)
     */
    public function matchesCode(string $code): bool
    {
        return strtoupper($this->code) === strtoupper($code);
    }
}