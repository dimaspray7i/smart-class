<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissionResource extends JsonResource
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
            'teacher_id' => $this->teacher_id,
            'date_from' => $this->date_from?->toDateString(),
            'date_to' => $this->date_to?->toDateString(),
            'date_range' => $this->date_range,
            'duration_days' => $this->duration_days,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'reason' => $this->reason,
            'attachment_url' => $this->attachment_url,
            'status' => $this->status,
            'status_label' => $this->getStatusLabelAttribute(),
            'status_color' => $this->status_color,
            'note' => $this->note,
            'approved_at' => $this->approved_at?->toDateTimeString(),
            'is_active' => $this->is_active,
            'can_be_processed' => $this->canBeProcessed(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'created_at_human' => $this->created_at?->diffForHumans(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'student' => $this->whenLoaded('student', function () {
                return new UserResource($this->student);
            }),
            
            'teacher' => $this->whenLoaded('teacher', function () {
                return new UserResource($this->teacher);
            }),
        ];
    }

    /**
     * Get status label
     */
    private function getStatusLabelAttribute(): string
    {
        $labels = [
            'pending' => 'Pending',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
        ];

        return $labels[$this->status] ?? $this->status;
    }
}