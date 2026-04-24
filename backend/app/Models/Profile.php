<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'user_id',
        'nis',
        'nip',
        'class_level',
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
}