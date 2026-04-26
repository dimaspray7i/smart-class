<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'email' => $this->email,
            'role' => $this->role,
            'role_label' => $this->getRoleLabelAttribute(),
            'slug' => $this->slug,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'profile' => $this->whenLoaded('profile', function () {
                return new ProfileResource($this->profile);
            }),
            
            'classes' => $this->whenLoaded('classes', function () {
                return ClassResource::collection($this->classes);
            }),
            
            'skills' => $this->whenLoaded('skills', function () {
                return SkillResource::collection($this->skills);
            }),
            
            // Conditional fields based on role
            'nis' => $this->when($this->role === 'siswa', function () {
                return $this->profile?->nis;
            }),
            
            'nip' => $this->when($this->role === 'guru', function () {
                return $this->profile?->nip;
            }),
            
            'class_level' => $this->when($this->role === 'siswa', function () {
                return $this->profile?->class_level;
            }),
        ];
    }

    /**
     * Get role label in Indonesian
     */
    private function getRoleLabelAttribute(): string
    {
        $labels = [
            'admin' => 'Administrator',
            'guru' => 'Guru',
            'siswa' => 'Siswa',
        ];

        return $labels[$this->role] ?? $this->role;
    }

    /**
     * Customize the outgoing response for the resource.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Http\JsonResponse  $response
     * @return void
     */
    public function withResponse($request, $response): void
    {
        // Add custom headers if needed
        $response->header('X-RPL-API-Version', '1.0');
    }
}