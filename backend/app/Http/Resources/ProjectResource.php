<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
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
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'repository_url' => $this->repository_url,
            'demo_url' => $this->demo_url,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'status_color' => $this->status_color,
            'progress' => $this->progress,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'date_range' => $this->when($this->start_date || $this->end_date, function () {
                return $this->formatDateRange();
            }),
            'tags' => $this->tags ?? [],
            'visibility' => $this->visibility,
            'is_public' => $this->visibility,
            'is_overdue' => $this->is_overdue,
            'repository_domain' => $this->repository_domain,
            'logs_count' => $this->whenCounted('logs'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            
            'logs' => $this->whenLoaded('logs', function () {
                return CodingLogResource::collection($this->logs);
            }),
            
            'latest_log' => $this->when($this->latestLog, function () {
                return new CodingLogResource($this->latestLog);
            }),
        ];
    }

    /**
     * Format date range
     */
    private function formatDateRange(): string
    {
        $options = ['day' => 'numeric', 'month' => 'short', 'year' => 'numeric'];
        $start = $this->start_date?->format('d M Y') ?? 'TBD';
        $end = $this->end_date?->format('d M Y') ?? 'Ongoing';
        return $start . ' - ' . $end;
    }
}