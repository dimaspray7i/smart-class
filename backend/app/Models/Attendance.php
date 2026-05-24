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
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'attendances';

    /**
     * Attributes that are mass assignable.
     *
     * @var array<int, string>
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
        // PKL Fields
        'pkl_location_id',
        'location_name',
    ];

    /**
     * Attributes that should be cast.
     *
     * @return array<string, string>
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

    /**
     * Attendance belongs to a PKL location (if applicable)
     */
    public function pklLocation(): BelongsTo
    {
        return $this->belongsTo(PklLocation::class);
    }

    /**
     * Attendance belongs to an AttendanceSession via code_used → code
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'code_used', 'code');
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

    /**
     * Scope: PKL attendance only
     */
    public function scopePkl($query)
    {
        return $query->whereNotNull('pkl_location_id');
    }

    /**
     * Scope: School attendance only
     */
    public function scopeSchool($query)
    {
        return $query->whereNull('pkl_location_id');
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
            return $this->location_name ?? null;
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

    /**
     * Accessor: Check if this is a PKL attendance
     */
    public function getIsPklAttendanceAttribute(): bool
    {
        return $this->pkl_location_id !== null;
    }

    /**
     * Accessor: Get location type (school or pkl)
     */
    public function getLocationTypeAttribute(): string
    {
        return $this->pkl_location_id ? 'pkl' : 'school';
    }

    /**
     * Accessor: Get location name (company or "Sekolah")
     */
    public function getDisplayLocationNameAttribute(): string
    {
        return $this->location_name ?? 'Sekolah';
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Calculate distance from the attendance center (school or PKL location)
     */
    public function calculateDistanceFromCenter(): ?float
    {
        if (!$this->lat || !$this->lng) {
            return null;
        }

        // If PKL attendance, calculate from PKL location
        if ($this->pkl_location_id && $this->pklLocation) {
            return GeoHelper::calculateDistance(
                $this->lat,
                $this->lng,
                $this->pklLocation->latitude,
                $this->pklLocation->longitude
            );
        }

        // Otherwise, calculate from school
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
     * Check if within radius from center (school or PKL location)
     */
    public function isWithinRadius(?float $radius = null): bool
    {
        $distance = $this->calculateDistanceFromCenter();

        if ($distance === null) {
            return false;
        }

        // Use PKL location radius if applicable
        if ($this->pkl_location_id && $this->pklLocation) {
            $maxRadius = $radius ?? $this->pklLocation->radius_meters;
        } else {
            $maxRadius = $radius ?? config('app.attendance_radius_meters', 100);
        }

        return $distance <= $maxRadius;
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
     * Get Google Maps URL for attendance location
     */
    public function getGoogleMapsUrlAttribute(): ?string
    {
        if (!$this->lat || !$this->lng) {
            return null;
        }

        return "https://www.google.com/maps?q={$this->lat},{$this->lng}";
    }

    /**
     * Get distance formatted for display
     */
    public function getDistanceFormattedAttribute(): ?string
    {
        $distance = $this->calculateDistanceFromCenter();
        
        if ($distance === null) {
            return null;
        }

        return $distance >= 1000 
            ? round($distance / 1000, 2) . ' km' 
            : round($distance) . ' m';
    }
}