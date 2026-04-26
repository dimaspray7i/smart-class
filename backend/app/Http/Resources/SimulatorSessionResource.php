<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimulatorSessionResource extends JsonResource
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
            'career_path_id' => $this->career_path_id,
            'current_step_id' => $this->current_step_id,
            'choices' => $this->choices ?? [],
            'choices_count' => $this->choices_count,
            'completed_at' => $this->completed_at?->toDateTimeString(),
            'result' => $this->result ?? [],
            'session_token' => $this->session_token,
            'expires_at' => $this->expires_at?->toDateTimeString(),
            'expires_at_human' => $this->expires_at?->diffForHumans(),
            'is_valid' => $this->is_valid,
            'is_completed' => $this->is_completed,
            'progress' => $this->progress,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            
            'career_path' => $this->whenLoaded('career_path', function () {
                return new CareerPathResource($this->career_path);
            }),
            
            'current_step' => $this->whenLoaded('current_step', function () {
                return new SimulatorStepResource($this->current_step);
            }),
        ];
    }
}