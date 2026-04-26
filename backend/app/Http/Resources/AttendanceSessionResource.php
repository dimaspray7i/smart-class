<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSessionResource extends JsonResource
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
            'code' => $this->code,
            'class_id' => $this->class_id,
            'generated_by' => $this->generated_by,
            'valid_from' => $this->valid_from?->toDateTimeString(),
            'valid_until' => $this->valid_until?->toDateTimeString(),
            'is_active' => $this->is_active,
            'is_valid' => $this->is_valid,
            'max_uses' => $this->max_uses,
            'used_count' => $this->used_count,
            'remaining_uses' => $this->remaining_uses,
            'radius_meters' => $this->radius_meters,
            'center_lat' => $this->center_lat,
            'center_lng' => $this->center_lng,
            'center_location' => $this->center_location,
            'remaining_time' => $this->remaining_time,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'class' => $this->whenLoaded('class', function () {
                return new ClassResource($this->class);
            }),
            
            'teacher' => $this->whenLoaded('teacher', function () {
                return new UserResource($this->teacher);
            }),
        ];
    }
}