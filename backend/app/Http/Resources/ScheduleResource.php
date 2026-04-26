<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource
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
            'class_id' => $this->class_id,
            'subject_id' => $this->subject_id,
            'teacher_id' => $this->teacher_id,
            'day' => $this->day,
            'day_name' => $this->day_name,
            'start_time' => $this->start_time?->format('H:i'),
            'end_time' => $this->end_time?->format('H:i'),
            'time_range' => $this->time_range,
            'duration_minutes' => $this->duration,
            'room' => $this->room,
            'is_active' => $this->is_active,
            'is_now' => $this->is_now,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'class' => $this->whenLoaded('class', function () {
                return new ClassResource($this->class);
            }),
            
            'subject' => $this->whenLoaded('subject', function () {
                return new SubjectResource($this->subject);
            }),
            
            'teacher' => $this->whenLoaded('teacher', function () {
                return new UserResource($this->teacher);
            }),
        ];
    }
}