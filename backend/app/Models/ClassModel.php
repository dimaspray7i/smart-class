<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ClassModel extends Model
{
    use HasFactory;

    /**
     * Table name (karena 'class' reserved word di PHP)
     */
    protected $table = 'classes';

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'name',
        'level',
        'slug',
        'description',
        'capacity',
        'is_active',
    ];

    /**
     * Attributes to append to the model's array form.
     */
    protected $appends = ['wali_kelas'];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Boot model untuk auto-generate slug
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($class) {
            if (empty($class->slug)) {
                $class->slug = self::generateUniqueSlug($class->name);
            }
        });

        static::updating(function ($class) {
            // Regenerate slug if name changed
            if ($class->isDirty('name')) {
                $class->slug = self::generateUniqueSlug($class->name);
            }
        });
    }

    /**
     * Generate unique slug
     */
    private static function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        $query = self::where('slug', $slug);
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        while ($query->exists()) {
            $slug = $originalSlug . '-' . $counter++;
            $query = self::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
        }

        return $slug;
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS ⭐ FIXED & ENHANCED
    // ═══════════════════════════════════════════════════════════

    /**
     * Class has many users (many-to-many via class_user pivot)
     * 
     * Includes: students, teachers, wali_kelas
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class, 
            'class_user',      // pivot table
            'class_id',        // foreign key for ClassModel
            'user_id'          // foreign key for User
        )
        ->withPivot('role_in_class', 'academic_year', 'is_active')
        ->withTimestamps();
    }

    /**
     * Get ONLY students in this class
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'class_user',
            'class_id',
            'user_id'
        )
        ->wherePivot('role_in_class', 'siswa')
        ->wherePivot('is_active', true)
        ->withPivot('academic_year')
        ->withTimestamps();
    }

    /**
     * Get ALL teachers in this class (wali_kelas + guru_pengampu)
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'class_user',
            'class_id',
            'user_id'
        )
        ->whereIn('class_user.role_in_class', ['wali_kelas', 'guru_pengampu'])
        ->wherePivot('is_active', true)
        ->withPivot('role_in_class', 'academic_year')
        ->withTimestamps();
    }

    /**
     * Get ONLY wali kelas (single user) - FIXED: Return User model, not collection
     */
    public function waliKelasRelation(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'class_user',
            'class_id',
            'user_id'
        )
        ->wherePivot('role_in_class', 'wali_kelas')
        ->wherePivot('is_active', true)
        ->withPivot('academic_year')
        ->withTimestamps();
    }

    /**
     * Accessor for wali_kelas (returns single object instead of collection)
     */
    public function getWaliKelasAttribute()
    {
        return $this->waliKelasRelation()->first();
    }

    /**
     * Get subjects taught in this class (via schedules)
     */
    public function subjects()
    {
        return $this->hasMany(Schedule::class, 'class_id')
            ->join('subjects', 'schedules.subject_id', '=', 'subjects.id')
            ->select('subjects.*')
            ->distinct();
    }

    /**
     * Class has many schedules
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'class_id');
    }

    /**
     * Class has many attendance sessions
     */
    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'class_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    public function scopeLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    public function scopeWithCounts($query)
    {
        return $query->withCount([
            'students as students_count' => fn($q) => $q->wherePivot('is_active', true),
            'schedules as schedules_count' => fn($q) => $q->where('is_active', true),
        ]);
    }

    public function scopeWithRelations($query)
    {
        return $query->with([
            'teachers' => fn($q) => $q->select('users.id', 'users.name', 'users.email')->limit(5),
            'schedules' => fn($q) => $q->with(['subject', 'teacher'])->limit(5),
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS ⭐ OPTIMIZED: Use loaded counts
    // ═══════════════════════════════════════════════════════════

    /**
     * Get full class name with level
     */
    public function getFullNameAttribute(): string
    {
        return "RPL {$this->level} - {$this->name}";
    }

    /**
     * Get student count (uses loaded count if available)
     */
    public function getStudentCountAttribute(): int
    {
        // If withCount was used, use the loaded attribute
        if (isset($this->attributes['students_count'])) {
            return (int) $this->attributes['students_count'];
        }
        // Fallback: query database (less efficient)
        return $this->students()->count();
    }

    /**
     * Get available capacity
     */
    public function getAvailableCapacityAttribute(): int
    {
        return max(0, $this->capacity - $this->student_count);
    }

    /**
     * Check if class is full
     */
    public function getIsFullAttribute(): bool
    {
        return $this->student_count >= $this->capacity;
    }

    /**
     * Get teacher count (uses loaded count if available)
     */
    public function getTeacherCountAttribute(): int
    {
        if ($this->relationLoaded('teachers')) {
            return $this->teachers->count();
        }
        return $this->teachers()->count();
    }

    /**
     * Get subject count
     */
    public function getSubjectCountAttribute(): int
    {
        // Since subjects() uses join, we count via schedules
        if (isset($this->attributes['schedules_count'])) {
            // This is approximate; for exact subject count, query directly
            return $this->schedules()->distinct('subject_id')->count('subject_id');
        }
        return $this->subjects()->count();
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Add student to class
     */
    public function addStudent(User $user, array $pivotData = []): bool
    {
        if ($this->is_full) {
            return false;
        }

        // Check if already enrolled
        if ($this->students()->where('users.id', $user->id)->exists()) {
            return false;
        }

        $this->users()->attach($user->id, array_merge([
            'role_in_class' => 'siswa',
            'academic_year' => date('Y'),
            'is_active' => true,
        ], $pivotData));

        return true;
    }

    /**
     * Remove student from class
     */
    public function removeStudent(User $user): void
    {
        $this->users()->wherePivot('role_in_class', 'siswa')->detach($user->id);
    }

    /**
     * Assign teacher to class
     */
    public function assignTeacher(User $teacher, string $role = 'guru_pengampu', array $pivotData = []): bool
    {
        if (!in_array($role, ['wali_kelas', 'guru_pengampu'])) {
            return false;
        }

        // If assigning wali_kelas, remove existing wali_kelas first
        if ($role === 'wali_kelas') {
            $this->users()->wherePivot('role_in_class', 'wali_kelas')->detach();
        }

        $this->users()->attach($teacher->id, array_merge([
            'role_in_class' => $role,
            'academic_year' => date('Y'),
            'is_active' => true,
        ], $pivotData));

        return true;
    }

    /**
     * Remove teacher from class
     */
    public function removeTeacher(User $teacher): void
    {
        $this->users()
            ->wherePivot('role_in_class', '!=', 'siswa')
            ->detach($teacher->id);
    }

    /**
     * Get today's schedule for this class
     */
    public function getTodaySchedule(): \Illuminate\Support\Collection
    {
        $day = now()->locale('id')->dayName;

        return $this->schedules()
            ->where('day', strtolower($day))
            ->where('is_active', true)
            ->orderBy('start_time')
            ->with(['subject:id,name,code', 'teacher:id,name,email'])
            ->get();
    }

    /**
     * Get attendance statistics for a date
     */
    public function getAttendanceStats(string $date = null): array
    {
        $date = $date ?? today()->toDateString();
        
        // Get student IDs efficiently
        $studentIds = $this->students()->pluck('users.id');
        
        if ($studentIds->isEmpty()) {
            return [
                'total_students' => 0,
                'attended' => 0,
                'absent' => 0,
                'percentage' => 0,
                'by_status' => [],
            ];
        }

        $stats = Attendance::whereIn('user_id', $studentIds)
            ->where('date', $date)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $totalStudents = $this->student_count;
        $attended = ($stats['Hadir'] ?? 0) + ($stats['Terlambat'] ?? 0);
        $absent = $totalStudents - $attended;

        return [
            'total_students' => $totalStudents,
            'attended' => $attended,
            'absent' => $absent,
            'percentage' => $totalStudents > 0 ? round(($attended / $totalStudents) * 100, 2) : 0,
            'by_status' => [
                'hadir' => $stats['Hadir'] ?? 0,
                'terlambat' => $stats['Terlambat'] ?? 0,
                'izin' => $stats['Izin'] ?? 0,
                'sakit' => $stats['Sakit'] ?? 0,
                'alpha' => $stats['Alpha'] ?? 0,
            ],
        ];
    }

    /**
     * Check if user is enrolled in this class
     */
    public function hasUser(User $user, ?string $role = null): bool
    {
        $query = $this->users()->where('users.id', $user->id);
        
        if ($role) {
            $query->wherePivot('role_in_class', $role);
        }
        
        return $query->wherePivot('is_active', true)->exists();
    }

    /**
     * Get enrollment status for a user
     */
    public function getUserRole(User $user): ?string
    {
        $pivot = $this->users()
            ->where('users.id', $user->id)
            ->wherePivot('is_active', true)
            ->first()?->pivot;
            
        return $pivot?->role_in_class;
    }
}