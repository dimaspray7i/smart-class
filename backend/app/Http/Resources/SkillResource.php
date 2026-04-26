<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SkillResource extends JsonResource
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
            'slug' => $this->slug,
            'category' => $this->category,
            'category_label' => $this->category_label,
            'description' => $this->description,
            'icon' => $this->icon,
            'max_level' => $this->max_level,
            'is_active' => $this->is_active,
            'students_count' => $this->students_count,
            'average_level' => round($this->average_level, 2),
            'is_popular' => $this->is_popular,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}