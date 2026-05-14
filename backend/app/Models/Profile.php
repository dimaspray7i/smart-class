<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Profile extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'profiles';

    /**
     * Attributes yang dapat di-mass-assign
     * 
     */
    protected $fillable = [
        'user_id',
        'nis',
        'nip',
        'class_level',
        'major',
        'bio',
        'github_url',
        'linkedin_url',
        'preferences',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'preferences' => 'array',
        ];
    }

    /**
     * Boot model untuk auto-generate NIS/NIP
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($profile) {
            $user = User::find($profile->user_id);

            if ($user && $user->role === 'siswa' && empty($profile->nis)) {
                $profile->nis = self::generateNis();
            }

            if ($user && $user->role === 'guru' && empty($profile->nip)) {
                $profile->nip = self::generateNip();
            }
        });

        // Auto-delete subjects pivot when profile is deleted
        static::deleting(function ($profile) {
            // Pivot records will be auto-deleted via foreign key constraint
            // But we can explicitly detach if needed:
            // $profile->subjects()->detach();
        });
    }

    /**
     * Generate NIS unik
     */
    private static function generateNis(): string
    {
        $year = date('Y');
        $random = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
        return $year . $random;
    }

    /**
     * Generate NIP unik
     */
    private static function generateNip(): string
    {
        $year = date('Y');
        $random = str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
        return '19' . substr($year, 2) . $random;
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Profile belongs to one user
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Profile has many subjects (many-to-many via profile_subject pivot table)
     * 
     * Usage: $profile->subjects
     *        $profile->subjects()->attach($subjectId)
     *        $profile->subjects()->detach($subjectId)
     *        $profile->subjects()->sync([1, 2, 3])
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'profile_subject')
            ->withTimestamps();
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by class level
     */
    public function scopeClassLevel($query, string $level)
    {
        return $query->where('class_level', $level);
    }

    /**
     * Scope: Get students only (has NIS)
     */
    public function scopeStudents($query)
    {
        return $query->whereNotNull('nis');
    }

    /**
     * Scope: Get teachers only (has NIP)
     */
    public function scopeTeachers($query)
    {
        return $query->whereNotNull('nip');
    }

    /**
     * Scope: Filter profiles that have specific subject
     */
    public function scopeWithSubject($query, int $subjectId)
    {
        return $query->whereHas('subjects', function ($q) use ($subjectId) {
            $q->where('subjects.id', $subjectId);
        });
    }

    /**
     * Scope: Filter profiles that have any of the given subjects
     */
    public function scopeWithAnySubject($query, array $subjectIds)
    {
        return $query->whereHas('subjects', function ($q) use ($subjectIds) {
            $q->whereIn('subjects.id', $subjectIds);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get full GitHub URL
     */
    public function getGithubUrlAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        // Jika bukan URL lengkap, tambahkan github.com
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return 'https://github.com/' . ltrim($value, '/');
        }

        return $value;
    }

    /**
     * Accessor: Get full LinkedIn URL
     */
    public function getLinkedinUrlAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        // Jika bukan URL lengkap, tambahkan linkedin.com/in/
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return 'https://linkedin.com/in/' . ltrim($value, '/');
        }

        return $value;
    }

    /**
     * Accessor: Get display identity (NIS or NIP)
     */
    public function getDisplayIdentityAttribute(): ?string
    {
        return $this->nis ?? $this->nip;
    }

    /**
     * Accessor: Get role type from identity
     */
    public function getRoleTypeAttribute(): ?string
    {
        if ($this->nis) {
            return 'siswa';
        }

        if ($this->nip) {
            return 'guru';
        }

        return null;
    }

    /**
     * Accessor: Get subjects as simple array of IDs
     */
    public function getSubjectIdsAttribute(): array
    {
        return $this->subjects->pluck('id')->toArray();
    }

    /**
     * Accessor: Get subjects as simple array of names
     */
    public function getSubjectNamesAttribute(): array
    {
        return $this->subjects->pluck('name')->toArray();
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Check if profile has specific subject
     */
    public function hasSubject(int $subjectId): bool
    {
        return $this->subjects->contains('id', $subjectId);
    }

    /**
     * Add subject to profile
     */
    public function addSubject(int $subjectId): bool
    {
        if ($this->hasSubject($subjectId)) {
            return false;
        }
        
        $this->subjects()->attach($subjectId);
        return true;
    }

    /**
     * Remove subject from profile
     */
    public function removeSubject(int $subjectId): bool
    {
        if (!$this->hasSubject($subjectId)) {
            return false;
        }
        
        $this->subjects()->detach($subjectId);
        return true;
    }

    /**
     * Sync subjects (replace all with given array)
     */
    public function syncSubjects(array $subjectIds): void
    {
        $this->subjects()->sync($subjectIds);
    }

    /**
     * Get count of subjects
     */
    public function getSubjectsCountAttribute(): int
    {
        return $this->subjects->count();
    }

    /**
     * Check if profile is for a teacher with subjects
     */
    public function getIsTeacherWithSubjectsAttribute(): bool
    {
        return $this->role_type === 'guru' && $this->subjects_count > 0;
    }
}