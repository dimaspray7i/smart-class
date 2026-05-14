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
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'users';

    /**
     * Attributes that are mass assignable.
     *
     * @var array<int, string>
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
        'pkl_location_id',
    ];

    /**
     * Attributes that should be hidden from serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attributes that should be cast.
     *
     * @return array<string, string>
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
     * User belongs to a PKL location
     */
    public function pklLocation(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(PklLocation::class, 'pkl_location_id');
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
        return $this->belongsToMany(Skill::class, 'student_skills', 'user_id', 'skill_id')
            ->withPivot('level', 'hours_practiced', 'last_practiced_at', 'evidence')
            ->withTimestamps();
    }

    /**
     * User belongs to many classes (many-to-many)
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(ClassModel::class, 'class_user', 'user_id', 'class_id')
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

    /**
     * Scope: Class 12 students only (PKL eligible)
     */
    public function scopeClass12($query)
    {
        return $query->whereHas('profile', function ($q) {
            $q->where('class_level', 'XII');
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
    // PKL HELPER METHODS (NEW)
    // ═══════════════════════════════════════════════════════════

    /**
     * Check if user is a class 12 student eligible for PKL attendance.
     */
    public function isPklEligible(): bool
    {
        return $this->role === 'siswa' 
            && $this->profile 
            && $this->profile->class_level === 'XII'
            && config('app.pkl_enable_pkl_attendance', true);
    }

    /**
     * Get approved PKL locations for this user.
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getApprovedPklLocations()
    {
        if (!$this->isPklEligible()) {
            return collect();
        }
        
        return PklLocation::approved()
            ->select('id', 'company_name', 'address', 'latitude', 'longitude', 'radius_meters', 'supervisor_name', 'supervisor_phone')
            ->orderBy('company_name')
            ->get();
    }

    /**
     * Check if user can attend at given coordinates (school or approved PKL location).
     */
    public function canAttendAtLocation(float $lat, float $lng): array
    {
        $result = [
            'can_attend' => false,
            'location_type' => null, // 'school' or 'pkl'
            'location_name' => null,
            'distance' => null,
            'max_radius' => null,
            'message' => '',
        ];

        // Check school location first
        $schoolLat = config('app.school_latitude', -6.200000);
        $schoolLng = config('app.school_longitude', 106.816666);
        $schoolRadius = config('app.attendance_radius_meters', 100);
        
        $distanceToSchool = \App\Helpers\GeoHelper::calculateDistance(
            $lat, $lng, $schoolLat, $schoolLng
        );

        if ($distanceToSchool <= $schoolRadius) {
            $result['can_attend'] = true;
            $result['location_type'] = 'school';
            $result['location_name'] = config('app.school_name', 'Sekolah');
            $result['distance'] = round($distanceToSchool);
            $result['max_radius'] = $schoolRadius;
            $result['message'] = 'Lokasi valid (dalam radius sekolah).';
            return $result;
        }

        // If class 12, check approved PKL locations
        if ($this->isPklEligible()) {
            $approvedPklLocations = PklLocation::approved()->get();
            
            foreach ($approvedPklLocations as $pklLoc) {
                $distanceToPkl = \App\Helpers\GeoHelper::calculateDistance(
                    $lat, $lng, $pklLoc->latitude, $pklLoc->longitude
                );
                
                if ($distanceToPkl <= $pklLoc->radius_meters) {
                    $result['can_attend'] = true;
                    $result['location_type'] = 'pkl';
                    $result['location_name'] = $pklLoc->company_name;
                    $result['distance'] = round($distanceToPkl);
                    $result['max_radius'] = $pklLoc->radius_meters;
                    $result['message'] = "Lokasi valid (dalam radius {$pklLoc->company_name}).";
                    return $result;
                }
            }
        }

        // If we reach here, location is not valid
        $result['message'] = 'Lokasi tidak valid. Pastikan Anda berada di sekolah atau lokasi PKL yang disetujui.';
        $result['distance'] = round($distanceToSchool);
        $result['max_radius'] = $schoolRadius;
        
        return $result;
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
            'pkl_count' => $this->attendances()->where('date', '>=', $since)->whereNotNull('pkl_location_id')->count(),
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

    /**
     * Get PKL attendance history
     */
    public function getPklAttendanceHistory(int $days = 90): array
    {
        return $this->attendances()
            ->whereNotNull('pkl_location_id')
            ->where('date', '>=', now()->subDays($days))
            ->with('pklLocation:id,company_name,address')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($attendance) {
                return [
                    'date' => $attendance->date->toDateString(),
                    'status' => $attendance->status,
                    'location' => $attendance->pklLocation?->company_name,
                    'address' => $attendance->pklLocation?->address,
                    'check_in_time' => $attendance->created_at?->format('H:i:s'),
                ];
            });
    }
}