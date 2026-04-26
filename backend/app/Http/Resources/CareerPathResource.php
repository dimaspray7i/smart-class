<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CareerPathResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'color' => $this->color,
            'required_skills' => $this->required_skills ?? [],
            'career_outcomes' => $this->career_outcomes ?? [],
            'is_active' => $this->is_active,
            'steps_count' => $this->steps_count,
            'sessions_count' => $this->sessions_count,
            'is_complete' => $this->is_complete,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'steps' => $this->whenLoaded('steps', function () {
                return SimulatorStepResource::collection($this->steps);
            }),
            
            'first_step' => $this->when($this->firstStep, function () {
                return new SimulatorStepResource($this->firstStep);
            }),
            
            'final_step' => $this->when($this->finalStep, function () {
                return new SimulatorStepResource($this->finalStep);
            }),
        ];
    }
}