<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'slug',
        'phone',
        'avatar_url',
        'is_active',
        'last_login_at',
    ];

    /**
     * Attributes yang harus di-hide saat serialization
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Boot model untuk auto-generate slug
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($user) {
            if (empty($user->slug)) {
                $user->slug = self::generateUniqueSlug($user->name);
            }
        });

        static::updating(function ($user) {
            if ($user->isDirty('name') && empty($user->slug)) {
                $user->slug = self::generateUniqueSlug($user->name);
            }
        });
    }

    /**
     * Generate unique slug dari name
     */
    private static function generateUniqueSlug(string $name): string
    {
        $slug = \Illuminate\Support\Str::slug($name);
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
     * User memiliki satu profile
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * User memiliki banyak attendance records
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * User memiliki banyak permission requests
     */
    public function permissions(): HasMany
    {
        return $this->hasMany(Permission::class);
    }

    /**
     * User memiliki banyak projects
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * User memiliki banyak coding logs
     */
    public function codingLogs(): HasMany
    {
        return $this->hasMany(CodingLog::class);
    }

    /**
     * User memiliki banyak skills (many-to-many)
     */
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'student_skills')
            ->withPivot('level', 'hours_practiced', 'last_practiced_at', 'evidence')
            ->withTimestamps();
    }

    /**
     * User belongs to many classes (many-to-many)
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_user')
            ->withPivot('role_in_class', 'academic_year', 'is_active')
            ->withTimestamps();
    }

    /**
     * User generates many attendance sessions (guru)
     */
    public function generatedAttendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'generated_by');
    }

    /**
     * User memiliki banyak simulator sessions
     */
    public function simulatorSessions(): HasMany
    {
        return $this->hasMany(SimulatorSession::class);
    }

    /**
     * User sebagai teacher untuk permissions
     */
    public function teacherPermissions(): HasMany
    {
        return $this->hasMany(Permission::class, 'teacher_id');
    }

    /**
     * User sebagai teacher untuk schedules
     */
    public function taughtSchedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'teacher_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: User aktif saja
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filter by role
     */
    public function scopeRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope: Siswa saja
     */
    public function scopeStudents($query)
    {
        return $query->where('role', 'siswa');
    }

    /**
     * Scope: Guru saja
     */
    public function scopeTeachers($query)
    {
        return $query->where('role', 'guru');
    }

    /**
     * Scope: Admin saja
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * Scope: Search by name or email
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%")
              ->orWhere('phone', 'like', "%{$search}%");
        });
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS & MUTATORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Format avatar URL
     */
    public function getAvatarUrlAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        // Jika URL absolut, return langsung
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // Jika relative path, tambahkan storage path
        return asset('storage/' . $value);
    }

    /**
     * Accessor: Get initials dari name
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = '';

        foreach ($words as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
            if (strlen($initials) >= 2) {
                break;
            }
        }

        return $initials;
    }

    /**
     * Accessor: Check jika user adalah siswa
     */
    public function getIsStudentAttribute(): bool
    {
        return $this->role === 'siswa';
    }

    /**
     * Accessor: Check jika user adalah guru
     */
    public function getIsTeacherAttribute(): bool
    {
        return $this->role === 'guru';
    }

    /**
     * Accessor: Check jika user adalah admin
     */
    public function getIsAdminAttribute(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Mutator: Set password dengan hash
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = bcrypt($value);
    }

    /**
     * Mutator: Auto deactivate user akan revoke tokens
     */
    public function setIsActiveAttribute(bool $value): void
    {
        $this->attributes['is_active'] = $value;

        if (!$value) {
            // Revoke semua token saat user di-deactivate
            $this->tokens()->delete();
        }
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Check jika user sudah absen hari ini
     */
    public function hasAttendedToday(): bool
    {
        return $this->attendances()
            ->where('date', today())
            ->exists();
    }

    /**
     * Get attendance status hari ini
     */
    public function getTodayAttendanceStatus(): ?string
    {
        $attendance = $this->attendances()
            ->where('date', today())
            ->first();

        return $attendance?->status;
    }

    /**
     * Get kelas user saat ini (untuk siswa)
     */
    public function getCurrentClass(): ?ClassModel
    {
        return $this->classes()
            ->wherePivot('academic_year', date('Y'))
            ->wherePivot('is_active', true)
            ->wherePivot('role_in_class', 'siswa')
            ->first();
    }

    /**
     * Get NIS user (untuk siswa)
     */
    public function getNisAttribute(): ?string
    {
        return $this->profile?->nis;
    }

    /**
     * Get NIP user (untuk guru)
     */
    public function getNipAttribute(): ?string
    {
        return $this->profile?->nip;
    }

    /**
     * Get class level (untuk siswa)
     */
    public function getClassLevelAttribute(): ?string
    {
        return $this->profile?->class_level;
    }

    /**
     * Update last login timestamp
     */
    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    /**
     * Get attendance statistics
     */
    public function getAttendanceStats(int $days = 30): array
    {
        $since = now()->subDays($days);

        return [
            'total' => $this->attendances()->where('date', '>=', $since)->count(),
            'hadir' => $this->attendances()->where('date', '>=', $since)->where('status', 'Hadir')->count(),
            'terlambat' => $this->attendances()->where('date', '>=', $since)->where('status', 'Terlambat')->count(),
            'izin' => $this->attendances()->where('date', '>=', $since)->where('status', 'Izin')->count(),
            'sakit' => $this->attendances()->where('date', '>=', $since)->where('status', 'Sakit')->count(),
            'alpha' => $this->attendances()->where('date', '>=', $since)->where('status', 'Alpha')->count(),
        ];
    }

    /**
     * Check if user can access specific feature
     */
    public function canAccessFeature(string $feature): bool
    {
        $permissions = [
            'admin' => ['all'],
            'guru' => ['attendance.create', 'attendance.view', 'students.view', 'permissions.manage'],
            'siswa' => ['attendance.submit', 'attendance.view', 'projects.manage', 'skills.view'],
        ];

        $userPermissions = $permissions[$this->role] ?? [];

        return in_array('all', $userPermissions) || in_array($feature, $userPermissions);
    }
}