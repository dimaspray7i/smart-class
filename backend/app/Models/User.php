<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

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
        'last_login_ip',
        'pkl_location_id',
        // Retro Futuristic fields
        'two_factor_enabled',
        'two_factor_method',
        'two_factor_secret',
        'theme_preferences',
        'notification_preferences',
        'remember_token',
    ];

    /**
     * Attributes that should be hidden from serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
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
            // Retro Futuristic casts
            'two_factor_enabled' => 'boolean',
            'theme_preferences' => 'array',
            'notification_preferences' => 'array',
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
    public function pklLocation(): BelongsTo
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

    /**
     * User memiliki banyak devices (Retro: device tracking)
     */
    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    /**
     * User memiliki banyak login histories (Retro: security audit)
     */
    public function loginHistories(): HasMany
    {
        return $this->hasMany(LoginHistory::class);
    }

    /**
     * User memiliki banyak notifications preferences (Retro: customizable)
     */
    public function notificationSettings(): HasOne
    {
        return $this->hasOne(NotificationSetting::class);
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

    /**
     * Scope: Users with retro theme enabled
     */
    public function scopeWithRetroTheme($query)
    {
        return $query->whereJsonContains('theme_preferences->enabled', true);
    }

    /**
     * Scope: Users who have 2FA enabled
     */
    public function scopeWith2FA($query)
    {
        return $query->where('two_factor_enabled', true);
    }

    /**
     * Scope: Recently active users (last 7 days)
     */
    public function scopeRecentlyActive($query, int $days = 7)
    {
        return $query->where('last_login_at', '>=', now()->subDays($days));
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
     * Accessor: Get retro theme preferences with defaults
     */
    public function getRetroThemeAttribute(): array
    {
        $defaults = [
            'enabled' => true,
            'version' => '2.0.0',
            'palette' => [
                'primary' => '#FF5C00',
                'secondary' => '#2E2BBF',
                'accent' => '#FFC928',
                'success' => '#10b981',
                'warning' => '#f59e0b',
                'danger' => '#f43f5e',
            ],
            'fonts' => ['retro-display', 'retro-mono', 'retro-hand'],
            'animations' => ['wobble', 'bounce', 'sparkle', 'float'],
            'components' => ['cards', 'badges', 'stickers', 'gradients'],
        ];

        return array_merge($defaults, $this->theme_preferences ?? []);
    }

    /**
     * Accessor: Get notification preferences with defaults
     */
    public function getNotificationPrefsAttribute(): array
    {
        $defaults = [
            'email' => [
                'attendance' => true,
                'permissions' => true,
                'pkl_updates' => true,
                'system_announcements' => true,
            ],
            'push' => [
                'attendance_reminder' => true,
                'permission_approved' => true,
                'pkl_reminder' => true,
            ],
            'whatsapp' => [
                'urgent_only' => true,
            ],
        ];

        return array_merge($defaults, $this->notification_preferences ?? []);
    }

    /**
     * Accessor: Get user's retro badges
     */
    public function getRetroBadgesAttribute(): array
    {
        $badges = [];
        
        // Early adopter badge (created before 6 months ago)
        if ($this->created_at->lt(now()->subMonths(6))) {
            $badges[] = [
                'name' => 'Early Adopter',
                'icon' => '🚀',
                'description' => 'Joined in the early days',
                'earned_at' => $this->created_at->toDateTimeString(),
                'rarity' => 'rare',
            ];
        }
        
        // PKL ready badge for grade 12 students
        if ($this->role === 'siswa' && $this->profile?->class_level === 'XII') {
            $badges[] = [
                'name' => 'PKL Ready',
                'icon' => '💼',
                'description' => 'Ready for internship program',
                'earned_at' => now()->toDateTimeString(),
                'rarity' => 'common',
            ];
        }
        
        // Active user badge (logged in within last 7 days)
        if ($this->last_login_at && $this->last_login_at->gt(now()->subDays(7))) {
            $badges[] = [
                'name' => 'Active User',
                'icon' => '⚡',
                'description' => 'Active in the last week',
                'earned_at' => $this->last_login_at->toDateTimeString(),
                'rarity' => 'common',
            ];
        }
        
        // Complete profile badge
        if ($this->profile && $this->profile->bio && $this->avatar_url) {
            $badges[] = [
                'name' => 'Profile Complete',
                'icon' => '✨',
                'description' => 'Fully customized profile',
                'earned_at' => $this->updated_at->toDateTimeString(),
                'rarity' => 'uncommon',
            ];
        }
        
        // Admin badge
        if ($this->role === 'admin') {
            $badges[] = [
                'name' => 'System Admin',
                'icon' => '🛡️',
                'description' => 'Full system access',
                'earned_at' => $this->created_at->toDateTimeString(),
                'rarity' => 'legendary',
            ];
        }
        
        // Teacher badge
        if ($this->role === 'guru') {
            $badges[] = [
                'name' => 'Educator',
                'icon' => '👨‍🏫',
                'description' => 'Teaching & mentoring',
                'earned_at' => $this->created_at->toDateTimeString(),
                'rarity' => 'epic',
            ];
        }

        // 2FA enabled badge
        if ($this->two_factor_enabled) {
            $badges[] = [
                'name' => 'Security Pro',
                'icon' => '🔐',
                'description' => 'Two-factor authentication enabled',
                'earned_at' => now()->toDateTimeString(),
                'rarity' => 'rare',
            ];
        }
        
        return $badges;
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

    /**
     * Mutator: Set theme preferences with validation
     */
    public function setThemePreferencesAttribute($value): void
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }
        
        // Validate & sanitize theme preferences
        $allowedColors = ['primary', 'secondary', 'accent', 'success', 'warning', 'danger'];
        $allowedFonts = ['retro-display', 'retro-mono', 'retro-hand', 'system'];
        $allowedAnimations = ['wobble', 'bounce', 'sparkle', 'float', 'none'];
        
        $sanitized = [];
        
        if (isset($value['enabled'])) {
            $sanitized['enabled'] = (bool) $value['enabled'];
        }
        
        if (isset($value['palette']) && is_array($value['palette'])) {
            $sanitized['palette'] = [];
            foreach ($allowedColors as $color) {
                if (isset($value['palette'][$color]) && preg_match('/^#[0-9A-F]{6}$/i', $value['palette'][$color])) {
                    $sanitized['palette'][$color] = strtoupper($value['palette'][$color]);
                }
            }
        }
        
        if (isset($value['fonts']) && is_array($value['fonts'])) {
            $sanitized['fonts'] = array_intersect($value['fonts'], $allowedFonts);
        }
        
        if (isset($value['animations']) && is_array($value['animations'])) {
            $sanitized['animations'] = array_intersect($value['animations'], $allowedAnimations);
        }
        
        $this->attributes['theme_preferences'] = json_encode($sanitized);
    }

    /**
     * Mutator: Set notification preferences with validation
     */
    public function setNotificationPreferencesAttribute($value): void
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }
        
        // Validate & sanitize notification preferences
        $allowedChannels = ['email', 'push', 'whatsapp'];
        $allowedEvents = [
            'email' => ['attendance', 'permissions', 'pkl_updates', 'system_announcements'],
            'push' => ['attendance_reminder', 'permission_approved', 'pkl_reminder'],
            'whatsapp' => ['urgent_only'],
        ];
        
        $sanitized = [];
        
        foreach ($allowedChannels as $channel) {
            if (isset($value[$channel]) && is_array($value[$channel])) {
                $sanitized[$channel] = [];
                foreach ($allowedEvents[$channel] ?? [] as $event) {
                    if (isset($value[$channel][$event])) {
                        $sanitized[$channel][$event] = (bool) $value[$channel][$event];
                    }
                }
            }
        }
        
        $this->attributes['notification_preferences'] = json_encode($sanitized);
    }

    // ═══════════════════════════════════════════════════════════
    // PKL HELPER METHODS (EXISTING - KEPT INTACT)
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
    // BUSINESS LOGIC METHODS (EXISTING - KEPT INTACT)
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

    // ═══════════════════════════════════════════════════════════
    // 🔮 RETRO FUTURISTIC HELPER METHODS (NEW)
    // ═══════════════════════════════════════════════════════════

    /**
     * Get dashboard redirect URL based on user role (Retro style)
     */
    public function getRetroDashboardUrl(): string
    {
        return match($this->role) {
            'admin' => '/dashboard/admin',
            'guru' => '/dashboard/teacher',
            'siswa' => '/dashboard/student',
            default => '/dashboard',
        };
    }

    /**
     * Get user permissions for retro frontend (enhanced)
     */
    public function getRetroPermissions(): array
    {
        $basePermissions = [
            'view_profile' => true,
            'update_profile' => true,
            'change_password' => true,
            'manage_2fa' => true,
            'manage_devices' => true,
            'view_retro_theme' => true,
            'update_retro_theme' => true,
        ];
        
        $rolePermissions = [
            'admin' => [
                'manage_users' => true,
                'manage_classes' => true,
                'manage_subjects' => true,
                'manage_schedules' => true,
                'manage_settings' => true,
                'view_analytics' => true,
                'export_data' => true,
                'manage_pkl' => true,
                'manage_retro_features' => true,
            ],
            'guru' => [
                'view_classes' => true,
                'manage_attendance' => true,
                'view_students' => true,
                'manage_permissions' => true,
                'view_reports' => true,
                'retro_attendance_ui' => true,
            ],
            'siswa' => [
                'submit_attendance' => true,
                'view_attendance_history' => true,
                'manage_projects' => true,
                'view_skills' => true,
                'submit_pkl_report' => true,
                'retro_dashboard' => true,
            ],
        ];
        
        return array_merge($basePermissions, $rolePermissions[$this->role] ?? []);
    }

    /**
     * Get quick actions for retro frontend
     */
    public function getRetroQuickActions(): array
    {
        $actions = [
            ['label' => 'View Profile', 'icon' => '👤', 'route' => '/profile', 'role' => ['admin', 'guru', 'siswa']],
            ['label' => 'Settings', 'icon' => '⚙️', 'route' => '/settings', 'role' => ['admin', 'guru', 'siswa']],
            ['label' => 'Theme Customizer', 'icon' => '🎨', 'route' => '/settings/theme', 'role' => ['admin', 'guru', 'siswa']],
        ];
        
        $roleActions = [
            'admin' => [
                ['label' => 'Manage Users', 'icon' => '👥', 'route' => '/admin/users'],
                ['label' => 'Dashboard', 'icon' => '📊', 'route' => '/admin/dashboard'],
                ['label' => 'System Settings', 'icon' => '🔧', 'route' => '/admin/settings'],
                ['label' => 'Analytics', 'icon' => '📈', 'route' => '/admin/analytics'],
            ],
            'guru' => [
                ['label' => 'Take Attendance', 'icon' => '📝', 'route' => '/teacher/attendance'],
                ['label' => 'My Classes', 'icon' => '🏫', 'route' => '/teacher/classes'],
                ['label' => 'Permissions', 'icon' => '✅', 'route' => '/teacher/permissions'],
                ['label' => 'Student Reports', 'icon' => '📋', 'route' => '/teacher/reports'],
            ],
            'siswa' => [
                ['label' => 'Check In', 'icon' => '📍', 'route' => '/student/attendance'],
                ['label' => 'My Projects', 'icon' => '💻', 'route' => '/student/projects'],
                ['label' => 'Skills Progress', 'icon' => '🎯', 'route' => '/student/skills'],
                ['label' => 'PKL Dashboard', 'icon' => '💼', 'route' => '/student/pkl'],
            ],
        ];
        
        $userActions = $roleActions[$this->role] ?? [];
        
        return array_merge($actions, array_filter($userActions, fn($a) => in_array($this->role, $a['role'] ?? [$this->role])));
    }

    /**
     * Get user stats for retro profile display
     */
    public function getRetroStats(): array
    {
        $stats = [
            'member_since' => $this->created_at->format('M Y'),
            'last_active' => $this->last_login_at?->diffForHumans() ?? 'Never',
            'total_logins' => $this->loginHistories()->count(),
            'devices_used' => $this->devices()->count(),
            'security_score' => $this->calculateSecurityScore(),
        ];
        
        // Role-specific stats
        if ($this->role === 'siswa') {
            $attendanceStats = $this->getAttendanceStats(30);
            $stats = array_merge($stats, [
                'attendance_rate' => $attendanceStats['total'] > 0 
                    ? round(($attendanceStats['hadir'] / $attendanceStats['total']) * 100) 
                    : 0,
                'projects_submitted' => $this->projects()->count(),
                'skills_mastered' => $this->skills()->wherePivot('level', '>=', 80)->count(),
                'pkl_days' => $this->attendances()->whereNotNull('pkl_location_id')->count(),
            ]);
        }
        
        if ($this->role === 'guru') {
            $stats = array_merge($stats, [
                'classes_taught' => $this->taughtSchedules()->distinct('class_id')->count(),
                'students_managed' => $this->classes()->wherePivot('role_in_class', '!=', 'wali_kelas')->sum(function($c) {
                    return $c->students()->count();
                }),
                'permissions_reviewed' => $this->teacherPermissions()->count(),
            ]);
        }
        
        if ($this->role === 'admin') {
            $stats = array_merge($stats, [
                'users_managed' => User::count(),
                'system_uptime' => '99.9%', // Would calculate from logs
                'settings_updated' => 0, // Would track from audit log
            ]);
        }
        
        return $stats;
    }

    /**
     * Calculate security score (0-100) for retro display
     */
    public function calculateSecurityScore(): int
    {
        $score = 50; // Base score
        
        // +10 for strong password (would check password strength)
        $score += 10;
        
        // +15 for 2FA enabled
        if ($this->two_factor_enabled) {
            $score += 15;
        }
        
        // +10 for email verified
        if ($this->email_verified_at) {
            $score += 10;
        }
        
        // +5 for phone verified
        if ($this->phone && strlen($this->phone) >= 10) {
            $score += 5;
        }
        
        // +10 for recent activity (last 30 days)
        if ($this->last_login_at && $this->last_login_at->gt(now()->subDays(30))) {
            $score += 10;
        }
        
        // -10 for each failed login in last 24h (would track)
        // -20 if using weak password (would check)
        
        return min(100, max(0, $score));
    }

    /**
     * Check if user should see retro theme by default
     */
    public function shouldUseRetroTheme(): bool
    {
        // Check explicit preference first
        if (isset($this->theme_preferences['enabled'])) {
            return (bool) $this->theme_preferences['enabled'];
        }
        
        // Default to retro for new users
        return $this->created_at->gt(now()->subMonths(1));
    }

    /**
     * Get 2FA methods available for this user
     */
    public function getAvailable2FAMethods(): array
    {
        $methods = ['email' => ['enabled' => true, 'verified' => (bool) $this->email_verified_at]];
        
        if ($this->phone) {
            $methods['whatsapp'] = ['enabled' => true, 'verified' => false]; // Would implement verification
        }
        
        $methods['authenticator'] = ['enabled' => true, 'verified' => (bool) $this->two_factor_secret];
        
        return $methods;
    }

    /**
     * Send retro-style welcome notification
     */
    public function sendRetroWelcome(): void
    {
        // Would implement with your notification service
        // Example: dispatch new RetroWelcomeNotification($this);
        
        \Log::info('Retro welcome sent', [
            'user_id' => $this->id,
            'email' => $this->email,
            'retro_badges' => $this->retro_badges,
        ]);
    }

    /**
     * Get user's retro avatar with fallback
     */
    public function getRetroAvatar(?int $size = 100): string
    {
        if ($this->avatar_url) {
            return $this->avatar_url;
        }
        
        // Generate retro-style initials avatar
        $colors = ['#FF5C00', '#2E2BBF', '#FFC928', '#9D4EDD', '#B8F64E', '#FF6B9D'];
        $color = $colors[$this->id % count($colors)];
        $initials = $this->initials;
        
        // Return data URL for retro avatar (simplified)
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='{$size}' height='{$size}' viewBox='0 0 {$size} {$size}'%3E%3Crect width='{$size}' height='{$size}' fill='{$color}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='monospace' font-size='" . ($size * 0.4) . "' fill='white' font-weight='bold'%3E{$initials}%3C/text%3E%3C/svg%3E";
    }

    /**
     * Get user activity timeline for retro profile
     */
    public function getRetroActivityTimeline(int $limit = 10): array
    {
        $activities = [];
        
        // Login activity
        if ($this->last_login_at) {
            $activities[] = [
                'type' => 'login',
                'icon' => '🔐',
                'message' => 'Logged in',
                'timestamp' => $this->last_login_at->toDateTimeString(),
                'retro_style' => 'success',
            ];
        }
        
        // Attendance activity (for students)
        if ($this->role === 'siswa') {
            $lastAttendance = $this->attendances()->latest()->first();
            if ($lastAttendance) {
                $activities[] = [
                    'type' => 'attendance',
                    'icon' => $lastAttendance->status === 'Hadir' ? '✅' : '⚠️',
                    'message' => "Attendance: {$lastAttendance->status}",
                    'timestamp' => $lastAttendance->created_at->toDateTimeString(),
                    'retro_style' => $lastAttendance->status === 'Hadir' ? 'success' : 'warning',
                ];
            }
        }
        
        // Project activity (for students)
        if ($this->role === 'siswa') {
            $lastProject = $this->projects()->latest()->first();
            if ($lastProject) {
                $activities[] = [
                    'type' => 'project',
                    'icon' => '💻',
                    'message' => "Updated project: {$lastProject->title}",
                    'timestamp' => $lastProject->updated_at->toDateTimeString(),
                    'retro_style' => 'info',
                ];
            }
        }
        
        // Sort by timestamp and limit
        usort($activities, fn($a, $b) => strtotime($b['timestamp']) - strtotime($a['timestamp']));
        
        return array_slice($activities, 0, $limit);
    }

    /**
     * Check if user has permission for retro feature
     */
    public function canUseRetroFeature(string $feature): bool
    {
        $featurePermissions = [
            'animated_badges' => ['admin', 'guru', 'siswa'],
            'custom_themes' => ['admin', 'guru', 'siswa'],
            'sticker_mode' => ['admin'],
            'retro_analytics' => ['admin', 'guru'],
            'advanced_2fa' => ['admin', 'guru'],
            'device_management' => ['admin', 'guru', 'siswa'],
            'export_retro_data' => ['admin'],
        ];
        
        return in_array($this->role, $featurePermissions[$feature] ?? []);
    }

    /**
     * Serialize user for retro API responses
     */
    public function toRetroArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'avatar_url' => $this->avatar_url,
            'retro_avatar' => $this->getRetroAvatar(),
            'initials' => $this->initials,
            'is_active' => $this->is_active,
            'last_login_at' => $this->last_login_at?->toDateTimeString(),
            'created_at' => $this->created_at->toDateTimeString(),
            
            // Retro-specific fields
            'retro_theme' => $this->retro_theme,
            'notification_prefs' => $this->notification_prefs,
            'retro_badges' => $this->retro_badges,
            'retro_permissions' => $this->getRetroPermissions(),
            'retro_quick_actions' => $this->getRetroQuickActions(),
            'retro_stats' => $this->getRetroStats(),
            'security_score' => $this->calculateSecurityScore(),
            'two_factor_enabled' => $this->two_factor_enabled,
            'available_2fa_methods' => $this->getAvailable2FAMethods(),
            
            // Relationships (lazy loaded)
            'profile' => $this->whenLoaded('profile'),
            'current_class' => $this->whenLoaded('classes', fn() => $this->getCurrentClass()),
        ];
    }

    /**
     * Scope: Users with complete retro profile
     */
    public function scopeWithCompleteRetroProfile($query)
    {
        return $query->whereHas('profile', function($q) {
            $q->whereNotNull('bio')
              ->orWhereNotNull('github_url')
              ->orWhereNotNull('linkedin_url');
        })->whereNotNull('avatar_url');
    }

    /**
     * Scope: Users eligible for retro features
     */
    public function scopeRetroEligible($query)
    {
        return $query->where('is_active', true)
            ->where(function($q) {
                $q->whereJsonContains('theme_preferences->enabled', true)
                  ->orWhereNull('theme_preferences'); // Default to eligible
            });
    }
}