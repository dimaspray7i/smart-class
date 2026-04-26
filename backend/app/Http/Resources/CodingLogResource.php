<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CodingLogResource extends JsonResource
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
            'project_id' => $this->project_id,
            'user_id' => $this->user_id,
            'commit_hash' => $this->commit_hash,
            'short_commit' => $this->short_commit,
            'branch_name' => $this->branch_name,
            'description' => $this->description,
            'lines_added' => $this->lines_added,
            'lines_deleted' => $this->lines_deleted,
            'net_lines_changed' => $this->net_lines_changed,
            'files_changed' => $this->files_changed ?? [],
            'files_changed_count' => $this->files_changed_count,
            'code_churn' => $this->code_churn,
            'is_significant_change' => $this->is_significant_change,
            'github_commit_url' => $this->github_commit_url,
            'created_at' => $this->created_at?->toDateTimeString(),
            'created_at_human' => $this->created_at?->diffForHumans(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            
            // Relationships
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
        ];
    }
}