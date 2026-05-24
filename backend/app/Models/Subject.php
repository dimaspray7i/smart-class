<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'subjects';

    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * The data type of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'int';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'code',
        'name',
        'category',
        'credits',
        'description',
        'is_active',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'credits' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // 🎨 RETRO ACCESSORS (For Frontend Compatibility)
    // ═══════════════════════════════════════════════════════════

    /**
     * 🏷️ Accessor: Get human-readable category label
     * Used in frontend for retro badges and filters
     */
    public function getCategoryLabelAttribute(): string
    {
        return match($this->category) {
            'productive' => 'Produktif',
            'normative' => 'Normatif',
            'adaptive' => 'Adaptif',
            default => ucfirst($this->category ?? 'Unknown'),
        };
    }

    /**
     * 🎨 Accessor: Get retro badge config for frontend styling
     * Returns icon, color class, and label for retro UI
     */
    public function getRetroBadgeAttribute(): array
    {
        return [
            'productive' => [
                'icon' => '📊',
                'color' => 'retro-badge-purple',
                'label' => 'Produktif',
                'bg' => 'bg-retro-purple/10',
                'text' => 'text-retro-purple',
            ],
            'normative' => [
                'icon' => '📚',
                'color' => 'retro-badge-blue',
                'label' => 'Normatif',
                'bg' => 'bg-retro-blue/10',
                'text' => 'text-retro-blue',
            ],
            'adaptive' => [
                'icon' => '🔧',
                'color' => 'retro-badge-lime',
                'label' => 'Adaptif',
                'bg' => 'bg-retro-lime/10',
                'text' => 'text-retro-lime',
            ],
        ][$this->category] ?? [
            'icon' => '📚',
            'color' => 'retro-badge-blue',
            'label' => 'Normatif',
            'bg' => 'bg-retro-blue/10',
            'text' => 'text-retro-blue',
        ];
    }

    /**
     * 📝 Accessor: Get full subject name with code prefix
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->code} - {$this->name}";
    }

    /**
     * 👥 Accessor: Get count of teachers teaching this subject
     * Uses cached count if available, otherwise queries
     */
    public function getTeachersCountAttribute(): int
    {
        return $this->profiles()->count();
    }

    /**
     * 👨‍🏫 Accessor: Get teacher names as comma-separated string
     */
    public function getTeacherNamesAttribute(): string
    {
        return $this->profiles
            ->map(fn($p) => $p->user?->name)
            ->filter()
            ->implode(', ');
    }

    // ═══════════════════════════════════════════════════════════
    // 🔗 RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Subject has many schedules
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Subject belongs to many classes via class_subject pivot table
     * Note: ClassModel to avoid conflict with PHP reserved keyword
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_subject', 'subject_id', 'class_model_id')
            ->withTimestamps();
    }

    /**
     * Subject belongs to many profiles (teachers) via profile_subject pivot
     */
    public function profiles(): BelongsToMany
    {
        return $this->belongsToMany(Profile::class, 'profile_subject')
            ->withTimestamps();
    }



    // ═══════════════════════════════════════════════════════════
    // 🔍 SCOPES (Query Builders)
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope: Active subjects only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Search by name or code (case-insensitive)
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%");
        });
    }

    /**
     * Scope: Subjects taught by specific profile
     */
    public function scopeTaughtBy($query, int $profileId)
    {
        return $query->whereHas('profiles', fn($q) => 
            $q->where('profiles.id', $profileId)
        );
    }

    /**
     * Scope: Subjects taught by specific user (teacher)
     */
    public function scopeTaughtByUser($query, int $userId)
    {
        return $query->whereHas('profiles', fn($q) => 
            $q->where('user_id', $userId)
        );
    }

    /**
     * Scope: Subjects with at least one teacher assigned
     */
    public function scopeWithTeachers($query)
    {
        return $query->has('profiles');
    }

    /**
     * Scope: Subjects without any teacher assigned
     */
    public function scopeWithoutTeachers($query)
    {
        return $query->doesntHave('profiles');
    }

    // ═══════════════════════════════════════════════════════════
    // 💼 BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Check if subject is taught by specific profile
     */
    public function isTaughtBy(int $profileId): bool
    {
        return $this->profiles->contains('id', $profileId);
    }

    /**
     * Check if subject is taught by specific user (teacher)
     */
    public function isTaughtByUser(int $userId): bool
    {
        return $this->profiles->contains('user_id', $userId);
    }

    /**
     * Add teacher (profile) to this subject
     */
    public function addTeacher(int $profileId): bool
    {
        if ($this->isTaughtBy($profileId)) return false;
        $this->profiles()->attach($profileId);
        return true;
    }

    /**
     * Remove teacher (profile) from this subject
     */
    public function removeTeacher(int $profileId): bool
    {
        if (!$this->isTaughtBy($profileId)) return false;
        $this->profiles()->detach($profileId);
        return true;
    }

    /**
     * Sync teachers for this subject (replace all assignments)
     */
    public function syncTeachers(array $profileIds): void
    {
        $this->profiles()->sync($profileIds);
    }

    /**
     * Check if subject has any teacher assigned (uses loaded relation if available)
     */
    public function hasTeachers(): bool
    {
        return $this->relationLoaded('profiles') 
            ? $this->profiles->isNotEmpty()
            : $this->profiles()->exists();
    }

    /**
     * 🎯 Get subject info for API response with retro metadata
     * This is the format the frontend expects!
     */
    public function toApiArray(bool $withCounts = true): array
    {
        $data = [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'full_name' => $this->full_name,
            'category' => $this->category,
            'category_label' => $this->category_label, // ✅ Accessor
            'retro_badge' => $this->retro_badge,        // ✅ Retro accessor
            'credits' => $this->credits,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'teacher_names' => $this->teacher_names,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];

        if ($withCounts) {
            $data = array_merge($data, [
                'schedules_count' => $this->schedules_count ?? 0,
                'classes_count' => $this->classes_count ?? 0,
                'teachers_count' => $this->teachers_count,
            ]);
        }

        return $data;
    }
}