<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassResource extends JsonResource
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
            'name' => $this->name,
            'full_name' => $this->full_name,
            'level' => $this->level,
            'slug' => $this->slug,
            'description' => $this->description,
            'capacity' => $this->capacity,
            'student_count' => $this->student_count,
            'available_capacity' => $this->available_capacity,
            'is_full' => $this->is_full,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'students' => $this->when($request->user()?->role === 'admin' || $request->user()?->role === 'guru', function () {
                return UserResource::collection($this->whenLoaded('students'));
            }),
            
            'teachers' => $this->whenLoaded('teachers', function () {
                return UserResource::collection($this->teachers);
            }),
        ];
    }
}