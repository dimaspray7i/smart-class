<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
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
            'nis' => $this->nis,
            'nip' => $this->nip,
            'class_level' => $this->class_level,
            'class_level_label' => $this->getClassLevelLabelAttribute(),
            'bio' => $this->bio,
            'github_url' => $this->github_url,
            'linkedin_url' => $this->linkedin_url,
            'preferences' => $this->preferences,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }

    /**
     * Get class level label
     */
    private function getClassLevelLabelAttribute(): ?string
    {
        if (!$this->class_level) {
            return null;
        }

        return 'Kelas ' . $this->class_level;
    }
}