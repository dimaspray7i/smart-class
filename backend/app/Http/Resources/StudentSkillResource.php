<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentSkillResource extends JsonResource
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
            'skill_id' => $this->skill_id,
            'user_id' => $this->user_id,
            'level' => $this->level,
            'level_label' => $this->level_label,
            'level_color' => $this->level_color,
            'hours_practiced' => $this->hours_practiced,
            'last_practiced_at' => $this->last_practiced_at?->toDateTimeString(),
            'last_practiced_human' => $this->last_practiced_at?->diffForHumans(),
            'evidence' => $this->evidence ?? [],
            'evidence_count' => is_array($this->evidence) ? count($this->evidence) : 0,
            'is_mastered' => $this->level >= 80,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'skill' => $this->whenLoaded('skill', function () {
                return new SkillResource($this->skill);
            }),
        ];
    }
}