<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'repository_url',
        'demo_url',
        'status',
        'start_date',
        'end_date',
        'tags',
        'visibility',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'tags' => 'array',
            'visibility' => 'boolean',
        ];
    }

    /**
     * Boot model untuk auto-generate slug
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($project) {
            if (empty($project->slug)) {
                $project->slug = self::generateUniqueSlug($project->title);
            }
        });

        static::updating(function ($project) {
            if ($project->isDirty('title')) {
                $project->slug = self::generateUniqueSlug($project->title);
            }
        });
    }

    /**
     * Generate unique slug
     */
    private static function generateUniqueSlug(string $title): string
    {
        $slug = \Illuminate\Support\Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        while (self::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        return $slug;
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Project belongs to a user (owner)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Project has many coding logs
     */
    public function logs(): HasMany
    {
        return $this->hasMany(CodingLog::class, 'project_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Public projects only
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', true);
    }

    /**
     * Scope: Active projects (in_progress or review)
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['in_progress', 'review']);
    }

    /**
     * Scope: Completed projects
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope: For specific user
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Search by title or description
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('title', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get status label with color
     */
    public function getStatusColorAttribute(): string
    {
        $colors = [
            'planning' => 'gray',
            'in_progress' => 'blue',
            'review' => 'yellow',
            'completed' => 'green',
            'archived' => 'purple',
        ];

        return $colors[$this->status] ?? 'gray';
    }

    /**
     * Accessor: Get status label in Indonesian
     */
    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'planning' => 'Planning',
            'in_progress' => 'Sedang Dikerjakan',
            'review' => 'Review',
            'completed' => 'Selesai',
            'archived' => 'Arsip',
        ];

        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Accessor: Get progress percentage
     */
    public function getProgressAttribute(): int
    {
        $progressMap = [
            'planning' => 0,
            'in_progress' => 50,
            'review' => 80,
            'completed' => 100,
            'archived' => 100,
        ];

        return $progressMap[$this->status] ?? 0;
    }

    /**
     * Accessor: Get repository domain
     */
    public function getRepositoryDomainAttribute(): ?string
    {
        if (!$this->repository_url) {
            return null;
        }

        return parse_url($this->repository_url, PHP_URL_HOST);
    }

    /**
     * Accessor: Check if project is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        if (!$this->end_date) {
            return false;
        }

        return $this->end_date->isPast() && $this->status !== 'completed';
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Update project status
     */
    public function updateStatus(string $status): void
    {
        $validStatuses = ['planning', 'in_progress', 'review', 'completed', 'archived'];

        if (!in_array($status, $validStatuses)) {
            throw new \InvalidArgumentException("Invalid status: {$status}");
        }

        $this->update(['status' => $status]);

        if ($status === 'completed') {
            $this->update(['end_date' => today()]);
        }
    }

    /**
     * Add tag to project
     */
    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];

        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->update(['tags' => $tags]);
        }
    }

    /**
     * Remove tag from project
     */
    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tags = array_diff($tags, [$tag]);
        $this->update(['tags' => array_values($tags)]);
    }

    /**
     * Get total lines of code changed
     */
    public function getTotalLinesChangedAttribute(): array
    {
        return [
            'added' => $this->logs()->sum('lines_added'),
            'deleted' => $this->logs()->sum('lines_deleted'),
        ];
    }

    /**
     * Get latest coding log
     */
    public function getLatestLogAttribute(): ?CodingLog
    {
        return $this->logs()->latest()->first();
    }
}