<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;
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
    protected $appends = [
        'wali_kelas',
        'student_count',
        'subject_count',
        'available_capacity',
        'is_full',
        'teacher_count',
    ];

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

        static::creating(function (ClassModel $class): void {
            if (empty($class->slug)) {
                $class->slug = self::generateUniqueSlug($class->name);
            }
        });

        static::updating(function (ClassModel $class): void {
            // Regenerate slug if name changed
            if ($class->isDirty('name')) {
                $class->slug = self::generateUniqueSlug($class->name, $class->id);
            }
        });
    }

    /**
     * Generate unique slug with exclude option
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
    // 🔗 RELATIONSHIPS (Retro-Compatible)
    // ═══════════════════════════════════════════════════════════

    /**
     * Class has many users via class_user pivot table
     * Includes: students, teachers (wali_kelas + guru_pengampu)
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
     * Get ONLY students in this class (role_in_class = 'siswa')
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
     * Get ONLY wali kelas relationship (for internal use)
     * Returns BelongsToMany so we can chain queries
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
     * Accessor: Get wali kelas as single User model (or null)
     * This is what the frontend expects: $class->wali_kelas
     */
    public function getWaliKelasAttribute(): ?User
    {
        // If already loaded via eager loading, use it
        if ($this->relationLoaded('waliKelasRelation')) {
            return $this->waliKelasRelation->first();
        }
        // Otherwise query directly (less efficient)
        return $this->waliKelasRelation()->first();
    }

    /**
     * Get subjects via class_subject pivot table (MANY-TO-MANY)
     * 
     * IMPORTANT: Migration uses 'class_model_id' as FK, not 'class_id'
     * This is the CORRECT relationship for assigning subjects to classes
     */
    public function subjectsRelation(): BelongsToMany
    {
        return $this->belongsToMany(
            Subject::class,
            'class_subject',    // pivot table name
            'class_model_id',   // FK in pivot for ClassModel (matches migration)
            'subject_id'        // FK in pivot for Subject
        )
        ->withTimestamps();
    }

    /**
     * Legacy subjects() method for backward compatibility
     * Returns subjects via schedules (for display purposes only)
     * 
     * @deprecated Use subjectsRelation() for actual subject assignments
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
    // 🔍 SCOPES (Query Builders)
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
            'subjectsRelation as subjects_count', // Use correct relationship name
        ]);
    }

    public function scopeWithRelations($query)
    {
        return $query->with([
            'teachers' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.avatar_url')->limit(5),
            'schedules' => fn($q) => $q->with(['subject:id,name,code', 'teacher:id,name'])->limit(5),
            'waliKelasRelation' => fn($q) => $q->select('users.id', 'users.name'),
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    // 📊 ACCESSORS (Optimized for Retro Frontend)
    // ═══════════════════════════════════════════════════════════

    /**
     * Get full class name with level prefix
     */
    public function getFullNameAttribute(): string
    {
        return "RPL {$this->level} - {$this->name}";
    }

    /**
     * Get student count (uses loaded count if available for performance)
     */
    public function getStudentCountAttribute(): int
    {
        // If withCount was used, use the loaded attribute
        if (isset($this->attributes['students_count'])) {
            return (int) $this->attributes['students_count'];
        }
        // Fallback: query database (less efficient, avoid in loops)
        return $this->students()->count();
    }

    /**
     * Get available capacity (capacity - current students)
     */
    public function getAvailableCapacityAttribute(): int
    {
        return max(0, $this->capacity - $this->student_count);
    }

    /**
     * Check if class is at full capacity
     */
    public function getIsFullAttribute(): bool
    {
        return $this->student_count >= $this->capacity;
    }

    /**
     * Get teacher count (uses loaded relation if available)
     */
    public function getTeacherCountAttribute(): int
    {
        if ($this->relationLoaded('teachers')) {
            return $this->teachers->count();
        }
        return $this->teachers()->count();
    }

    /**
     * Get subject count via class_subject pivot table
     */
    public function getSubjectCountAttribute(): int
    {
        // If withCount was used with subjectsRelation, use loaded attribute
        if (isset($this->attributes['subjects_count'])) {
            return (int) $this->attributes['subjects_count'];
        }
        // Fallback: query via correct relationship
        return $this->subjectsRelation()->count();
    }

    // ═══════════════════════════════════════════════════════════
    // ⚙️ BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Add student to class with validation
     */
    public function addStudent(User $user, array $pivotData = []): bool
    {
        // Check capacity
        if ($this->is_full) {
            Log::warning("Cannot add student: class {$this->id} is full");
            return false;
        }

        // Check if already enrolled as student
        if ($this->students()->where('users.id', $user->id)->exists()) {
            Log::warning("User {$user->id} already enrolled in class {$this->id}");
            return false;
        }

        $this->users()->attach($user->id, array_merge([
            'role_in_class' => 'siswa',
            'academic_year' => date('Y'),
            'is_active' => true,
        ], $pivotData));

        Log::info("Student {$user->id} added to class {$this->id}");
        return true;
    }

    /**
     * Remove student from class
     */
    public function removeStudent(User $user): void
    {
        $this->users()->wherePivot('role_in_class', 'siswa')->detach($user->id);
        Log::info("Student {$user->id} removed from class {$this->id}");
    }

    /**
     * Assign teacher to class with role validation
     */
    public function assignTeacher(User $teacher, string $role = 'guru_pengampu', array $pivotData = []): bool
    {
        if (!in_array($role, ['wali_kelas', 'guru_pengampu'])) {
            Log::error("Invalid teacher role: {$role}");
            return false;
        }

        // If assigning wali_kelas, remove existing wali_kelas first
        if ($role === 'wali_kelas') {
            $this->users()->wherePivot('role_in_class', 'wali_kelas')->detach();
            Log::info("Removed existing wali_kelas from class {$this->id}");
        }

        $this->users()->attach($teacher->id, array_merge([
            'role_in_class' => $role,
            'academic_year' => date('Y'),
            'is_active' => true,
        ], $pivotData));

        Log::info("Teacher {$teacher->id} assigned as {$role} to class {$this->id}");
        return true;
    }

    /**
     * Remove teacher from class (non-student roles only)
     */
    public function removeTeacher(User $teacher): void
    {
        $this->users()
            ->wherePivot('role_in_class', '!=', 'siswa')
            ->detach($teacher->id);
        Log::info("Teacher {$teacher->id} removed from class {$this->id}");
    }

    /**
     * Assign subject to class via class_subject pivot
     */
    public function assignSubject(Subject $subject, array $pivotData = []): bool
    {
        // Check if pivot table exists
        if (!\Illuminate\Support\Facades\Schema::hasTable('class_subject')) {
            Log::error('class_subject table not found');
            return false;
        }

        // Check if already assigned
        if ($this->subjectsRelation()->where('subjects.id', $subject->id)->exists()) {
            Log::warning("Subject {$subject->id} already assigned to class {$this->id}");
            return false;
        }

        $this->subjectsRelation()->attach($subject->id, $pivotData);
        Log::info("Subject {$subject->id} assigned to class {$this->id}");
        return true;
    }

    /**
     * Remove subject from class
     */
    public function removeSubject(Subject $subject): void
    {
        if (\Illuminate\Support\Facades\Schema::hasTable('class_subject')) {
            $this->subjectsRelation()->detach($subject->id);
            Log::info("Subject {$subject->id} removed from class {$this->id}");
        }
    }

    /**
     * Sync multiple subjects to class (replace all)
     */
    public function syncSubjects(array $subjectIds): void
    {
        if (\Illuminate\Support\Facades\Schema::hasTable('class_subject')) {
            $this->subjectsRelation()->sync($subjectIds);
            Log::info("Subjects synced for class {$this->id}: " . json_encode($subjectIds));
        }
    }

    /**
     * Get today's schedule for this class (localized to Indonesian)
     */
    public function getTodaySchedule(): \Illuminate\Support\Collection
    {
        $day = now()->locale('id')->dayName; // Senin, Selasa, etc.

        return $this->schedules()
            ->where('day', strtolower($day))
            ->where('is_active', true)
            ->orderBy('start_time')
            ->with(['subject:id,name,code', 'teacher:id,name,avatar_url'])
            ->get();
    }

    /**
     * Get attendance statistics for a specific date
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
        $absent = max(0, $totalStudents - $attended);

        return [
            'date' => $date,
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
     * Check if user is enrolled in this class with optional role filter
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
     * Get enrollment role for a specific user in this class
     */
    public function getUserRole(User $user): ?string
    {
        $pivot = $this->users()
            ->where('users.id', $user->id)
            ->wherePivot('is_active', true)
            ->first()?->pivot;
            
        return $pivot?->role_in_class;
    }

    /**
     * Get all enrolled users with their roles (for admin view)
     */
    public function getEnrolledUsers(): \Illuminate\Support\Collection
    {
        return $this->users()
            ->wherePivot('is_active', true)
            ->select('users.id', 'users.name', 'users.email', 'users.role', 'users.avatar_url')
            ->withPivot('role_in_class', 'academic_year')
            ->orderByRaw("FIELD(pivot.role_in_class, 'wali_kelas', 'guru_pengampu', 'siswa')")
            ->orderBy('users.name')
            ->get();
    }

    /**
     * Check if class can accept more students
     */
    public function canAcceptStudents(int $count = 1): bool
    {
        return ($this->student_count + $count) <= $this->capacity;
    }

    /**
     * Get class info array for API response (Retro-compatible format)
     */
    public function toArrayForApi(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'level' => $this->level,
            'description' => $this->description,
            'capacity' => $this->capacity,
            'student_count' => $this->student_count,
            'available_capacity' => $this->available_capacity,
            'is_active' => $this->is_active,
            'is_full' => $this->is_full,
            'wali_kelas' => $this->wali_kelas?->only(['id', 'name', 'email', 'avatar_url']),
            'teacher_count' => $this->teacher_count,
            'subject_count' => $this->subject_count,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}