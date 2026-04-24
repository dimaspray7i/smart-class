<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodingLog extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'project_id',
        'user_id',
        'commit_hash',
        'branch_name',
        'description',
        'lines_added',
        'lines_deleted',
        'files_changed',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'lines_added' => 'integer',
            'lines_deleted' => 'integer',
            'files_changed' => 'array',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * CodingLog belongs to a project
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * CodingLog belongs to a user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: For specific project
     */
    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Scope: For specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Date range filter
     */
    public function scopeBetweenDates($query, string $from, string $to)
    {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    /**
     * Scope: Search by description or commit hash
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('description', 'like', "%{$search}%")
            ->orWhere('commit_hash', 'like', "%{$search}%");
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get short commit hash
     */
    public function getShortCommitAttribute(): ?string
    {
        if (!$this->commit_hash) {
            return null;
        }

        return substr($this->commit_hash, 0, 7);
    }

    /**
     * Accessor: Get net lines changed
     */
    public function getNetLinesChangedAttribute(): int
    {
        return ($this->lines_added ?? 0) - ($this->lines_deleted ?? 0);
    }

    /**
     * Accessor: Get files changed count
     */
    public function getFilesChangedCountAttribute(): int
    {
        return is_array($this->files_changed) ? count($this->files_changed) : 0;
    }

    /**
     * Accessor: Get GitHub commit URL (if repository is GitHub)
     */
    public function getGithubCommitUrlAttribute(): ?string
    {
        if (!$this->commit_hash || !$this->project?->repository_url) {
            return null;
        }

        if (str_contains($this->project->repository_url, 'github.com')) {
            return "{$this->project->repository_url}/commit/{$this->commit_hash}";
        }

        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Calculate code churn (total changes)
     */
    public function getCodeChurnAttribute(): int
    {
        return ($this->lines_added ?? 0) + ($this->lines_deleted ?? 0);
    }

    /**
     * Check if this is a significant change (>100 lines)
     */
    public function getIsSignificantChangeAttribute(): bool
    {
        return $this->code_churn > 100;
    }
}