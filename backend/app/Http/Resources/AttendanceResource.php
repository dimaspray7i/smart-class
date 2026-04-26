<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'date' => $this->date->toDateString(),
            'date_indonesian' => $this->date->locale('id')->isoFormat('dddd, D MMMM YYYY'),
            'lat' => $this->lat,
            'lng' => $this->lng,
            'location_string' => $this->location_string,
            'status' => $this->status,
            'status_label' => $this->getStatusLabelAttribute(),
            'status_color' => $this->getStatusColorAttribute(),
            'photo_url' => $this->photo_url,
            'code_used' => $this->code_used,
            'device_info' => $this->device_info,
            'verification_method' => $this->verification_method,
            'notes' => $this->notes,
            'check_in_time' => $this->created_at?->format('H:i:s'),
            'is_on_time' => $this->is_on_time,
            'is_late' => $this->is_late,
            'distance_from_school' => $this->when($this->lat && $this->lng, function () {
                return round($this->calculateDistanceFromSchool()) . ' m';
            }),
            'google_maps_url' => $this->google_maps_url,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
        ];
    }

    /**
     * Get status label in Indonesian
     */
    private function getStatusLabelAttribute(): string
    {
        $labels = [
            'Hadir' => 'Hadir',
            'Terlambat' => 'Terlambat',
            'Izin' => 'Izin',
            'Sakit' => 'Sakit',
            'Alpha' => 'Alpha',
        ];

        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Get status color for UI
     */
    private function getStatusColorAttribute(): string
    {
        $colors = [
            'Hadir' => 'green',
            'Terlambat' => 'yellow',
            'Izin' => 'blue',
            'Sakit' => 'orange',
            'Alpha' => 'red',
        ];

        return $colors[$this->status] ?? 'gray';
    }
}