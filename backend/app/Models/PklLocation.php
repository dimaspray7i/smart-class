<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PklLocation extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pkl_locations';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_name',
        'address',
        'latitude',
        'longitude',
        'radius_meters',
        'supervisor_name',
        'supervisor_phone',
        'supervisor_email',
        'notes',
        'is_approved',
        'approved_by',
        'approved_at',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'radius_meters' => 'integer',
            'is_approved' => 'boolean',
            'is_active' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Scope a query to only include approved locations.
     */
    public function scopeApproved($query)
    {
        return $query->where('is_approved', true)->where('is_active', true);
    }

    /**
     * Scope a query to only include active locations.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the admin user who approved this location.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get students assigned to this location.
     */
    public function students(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class, 'pkl_location_id');
    }

    /**
     * Check if location is within valid distance from student coordinates.
     */
    public function isWithinRadius(float $lat, float $lng): bool
    {
        $distance = \App\Helpers\GeoHelper::calculateDistance(
            $lat, $lng,
            $this->latitude, $this->longitude
        );
        
        return $distance <= $this->radius_meters;
    }

    /**
     * Get distance from given coordinates.
     */
    public function getDistanceFrom(float $lat, float $lng): float
    {
        return \App\Helpers\GeoHelper::calculateDistance(
            $lat, $lng,
            $this->latitude, $this->longitude
        );
    }

    /**
     * Get formatted location string.
     */
    public function getLocationStringAttribute(): string
    {
        return "{$this->company_name}, {$this->address}";
    }

    /**
     * Get Google Maps URL for this location.
     */
    public function getGoogleMapsUrlAttribute(): string
    {
        return "https://www.google.com/maps?q={$this->latitude},{$this->longitude}";
    }
}