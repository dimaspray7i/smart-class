<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimulatorStepResource extends JsonResource
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
            'career_path_id' => $this->career_path_id,
            'title' => $this->title,
            'content' => $this->content,
            'order' => $this->order,
            'is_final' => $this->is_final,
            'options' => $this->options ?? [],
            'options_count' => $this->options_count,
            'has_choices' => $this->has_choices,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}