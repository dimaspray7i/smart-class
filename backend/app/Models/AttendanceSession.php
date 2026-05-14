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
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'attendance_sessions';

    /**
     * Attributes that are mass assignable.
     *
     * @var array<int, string>
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
        // PKL: Link session to specific PKL location if created for PKL
        'pkl_location_id',
    ];

    /**
     * Attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valid_from' => 'datetime',
            'valid_until' => 'datetime',
            'is_active' => 'boolean',
            'radius_meters' => 'integer',
            'center_lat' => 'float',
            'center_lng' => 'float',
            'max_uses' => 'integer',
            'used_count' => 'integer',
        ];
    }

    /**
     * Boot model untuk auto-generate code dan defaults
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

            // Set default radius from config if not provided
            if (empty($session->radius_meters)) {
                $session->radius_meters = config('app.attendance_radius_meters', 100);
            }

            // Set default center coordinates from config if not provided
            if (empty($session->center_lat) && empty($session->center_lng)) {
                $session->center_lat = config('app.school_latitude', -6.200000);
                $session->center_lng = config('app.school_longitude', 106.816666);
            }
        });
    }

    /**
     * Generate unique 6-character alphanumeric code
     */
    private static function generateUniqueCode(): string
    {
        do {
            // Generate uppercase alphanumeric code
            $code = strtoupper(substr(str_replace(['+', '/', '='], '', base64_encode(random_bytes(4))), 0, 6));
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
     * Session has many attendances (matched by code)
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'code_used', 'code');
    }

    /**
     * Session belongs to a PKL location (if created for PKL)
     */
    public function pklLocation(): BelongsTo
    {
        return $this->belongsTo(PklLocation::class);
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Active and valid sessions only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('valid_from', '<=', now())
            ->where('valid_until', '>=', now());
    }

    /**
     * Scope: Valid code (case-insensitive)
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

    /**
     * Scope: For specific teacher
     */
    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('generated_by', $teacherId);
    }

    /**
     * Scope: PKL sessions only
     */
    public function scopePkl($query)
    {
        return $query->whereNotNull('pkl_location_id');
    }

    /**
     * Scope: School sessions only
     */
    public function scopeSchool($query)
    {
        return $query->whereNull('pkl_location_id');
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

        $diff = $this->valid_until->diff(now());
        
        if ($diff->h > 0) {
            return $diff->h . ' jam ' . $diff->i . ' menit';
        }
        if ($diff->i > 0) {
            return $diff->i . ' menit ' . $diff->s . ' detik';
        }
        return $diff->s . ' detik';
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

    /**
     * Accessor: Get session type (school or pkl)
     */
    public function getSessionTypeAttribute(): string
    {
        return $this->pkl_location_id ? 'pkl' : 'school';
    }

    /**
     * Accessor: Get formatted valid period
     */
    public function getValidPeriodAttribute(): string
    {
        return $this->valid_from->format('H:i') . ' - ' . $this->valid_until->format('H:i');
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
     * Extend session validity by minutes
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

    /**
     * Get the effective radius for this session
     */
    public function getEffectiveRadius(): int
    {
        // If linked to PKL location, use its radius
        if ($this->pkl_location_id && $this->pklLocation) {
            return $this->pklLocation->radius_meters;
        }
        
        return $this->radius_meters ?? config('app.attendance_radius_meters', 100);
    }

    /**
     * Get the effective center coordinates for this session
     */
    public function getEffectiveCenter(): array
    {
        // If linked to PKL location, use its coordinates
        if ($this->pkl_location_id && $this->pklLocation) {
            return [
                'lat' => $this->pklLocation->latitude,
                'lng' => $this->pklLocation->longitude,
            ];
        }
        
        return [
            'lat' => $this->center_lat ?? config('app.school_latitude', -6.200000),
            'lng' => $this->center_lng ?? config('app.school_longitude', 106.816666),
        ];
    }

    /**
     * Check if student is within session's effective radius
     */
    public function isStudentWithinRadius(float $lat, float $lng): bool
    {
        $center = $this->getEffectiveCenter();
        $radius = $this->getEffectiveRadius();
        
        $distance = GeoHelper::calculateDistance(
            $lat, $lng,
            $center['lat'], $center['lng']
        );
        
        return $distance <= $radius;
    }
}