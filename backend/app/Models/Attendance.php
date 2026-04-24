<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Helpers\GeoHelper;

class Attendance extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'user_id',
        'date',
        'lat',
        'lng',
        'status',
        'photo_url',
        'code_used',
        'device_info',
        'verification_method',
        'notes',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Attendance belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Today's attendance only
     */
    public function scopeToday($query)
    {
        return $query->where('date', today());
    }

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, string $status)
    {
        $validStatuses = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'];

        return in_array($status, $validStatuses)
            ? $query->where('status', $status)
            : $query;
    }

    /**
     * Scope: Date range filter
     */
    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    /**
     * Scope: Present students (Hadir or Terlambat)
     */
    public function scopePresent($query)
    {
        return $query->whereIn('status', ['Hadir', 'Terlambat']);
    }

    /**
     * Scope: Absent students (Alpha)
     */
    public function scopeAbsent($query)
    {
        return $query->where('status', 'Alpha');
    }

    /**
     * Scope: For specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get location as formatted string
     */
    public function getLocationStringAttribute(): ?string
    {
        if (!$this->lat || !$this->lng) {
            return null;
        }

        return sprintf('%.6f, %.6f', $this->lat, $this->lng);
    }

    /**
     * Accessor: Check if attendance is on time
     */
    public function getIsOnTimeAttribute(): bool
    {
        return $this->status === 'Hadir';
    }

    /**
     * Accessor: Check if attendance is late
     */
    public function getIsLateAttribute(): bool
    {
        return $this->status === 'Terlambat';
    }

    /**
     * Accessor: Get date in Indonesian format
     */
    public function getDateIndonesianAttribute(): string
    {
        return $this->date->locale('id')->isoFormat('dddd, D MMMM YYYY');
    }

    /**
     * Accessor: Get check-in time
     */
    public function getCheckInTimeAttribute(): ?string
    {
        return $this->created_at?->format('H:i:s');
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Calculate distance from school
     */
    public function calculateDistanceFromSchool(): ?float
    {
        if (!$this->lat || !$this->lng) {
            return null;
        }

        $schoolLat = config('app.school_latitude', -6.200000);
        $schoolLng = config('app.school_longitude', 106.816666);

        return GeoHelper::calculateDistance(
            $this->lat,
            $this->lng,
            $schoolLat,
            $schoolLng
        );
    }

    /**
     * Check if within radius from school
     */
    public function isWithinRadius(?float $radius = null): bool
    {
        $distance = $this->calculateDistanceFromSchool();

        if ($distance === null) {
            return false;
        }

        return $distance <= ($radius ?? config('app.attendance_radius_meters', 100));
    }

    /**
     * Update status manually
     */
    public function updateStatus(string $status, ?string $notes = null): void
    {
        $validStatuses = ['Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpha'];

        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }

        $this->update([
            'status' => $status,
            'verification_method' => 'manual',
            'notes' => $notes ?? $this->notes,
        ]);
    }

    /**
     * Mark as late
     */
    public function markAsLate(): void
    {
        $this->update(['status' => 'Terlambat']);
    }

    /**
     * Get Google Maps URL for location
     */
    public function getGoogleMapsUrlAttribute(): ?string
    {
        if (!$this->lat || !$this->lng) {
            return null;
        }

        return "https://www.google.com/maps?q={$this->lat},{$this->lng}";
    }
}