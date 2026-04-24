<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
    }

    /**
     * Generate unique slug
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
     * Class has many users (many-to-many)
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_user')
            ->withPivot('role_in_class', 'academic_year', 'is_active')
            ->withTimestamps();
    }

    /**
     * Class has many schedules
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    /**
     * Class has many attendance sessions
     */
    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class);
    }

    /**
     * Get students in this class
     */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_user')
            ->wherePivot('role_in_class', 'siswa')
            ->wherePivot('is_active', true)
            ->withPivot('academic_year')
            ->withTimestamps();
    }

    /**
     * Get teachers in this class
     */
    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_user')
            ->wherePivot('role_in_class', 'guru_pengampu')
            ->wherePivot('is_active', true)
            ->withPivot('academic_year')
            ->withTimestamps();
    }

    /**
     * Get wali kelas
     */
    public function waliKelas(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_user')
            ->wherePivot('role_in_class', 'wali_kelas')
            ->wherePivot('is_active', true)
            ->withPivot('academic_year')
            ->withTimestamps();
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by level (X, XI, XII)
     */
    public function scopeLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Scope: Active classes only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Search by name
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS & MUTATORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get full class name with level
     */
    public function getFullNameAttribute(): string
    {
        return "RPL {$this->level} - {$this->name}";
    }

    /**
     * Accessor: Get current student count
     */
    public function getStudentCountAttribute(): int
    {
        return $this->students()->count();
    }

    /**
     * Accessor: Get available capacity
     */
    public function getAvailableCapacityAttribute(): int
    {
        return $this->capacity - $this->student_count;
    }

    /**
     * Accessor: Check if class is full
     */
    public function getIsFullAttribute(): bool
    {
        return $this->student_count >= $this->capacity;
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Add student to class
     */
    public function addStudent(User $user, int $academicYear = null): bool
    {
        if ($this->is_full) {
            return false;
        }

        $this->users()->attach($user->id, [
            'role_in_class' => 'siswa',
            'academic_year' => $academicYear ?? date('Y'),
            'is_active' => true,
        ]);

        return true;
    }

    /**
     * Remove student from class
     */
    public function removeStudent(User $user): void
    {
        $this->users()->detach($user->id);
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
            ->with(['subject', 'teacher'])
            ->get();
    }

    /**
     * Get attendance statistics for this class
     */
    public function getAttendanceStats(string $date = null): array
    {
        $date = $date ?? today()->toDateString();

        $totalStudents = $this->student_count;
        $attended = Attendance::whereIn('user_id', $this->students()->pluck('users.id'))
            ->where('date', $date)
            ->whereIn('status', ['Hadir', 'Terlambat'])
            ->count();

        return [
            'total_students' => $totalStudents,
            'attended' => $attended,
            'absent' => $totalStudents - $attended,
            'percentage' => $totalStudents > 0 ? round(($attended / $totalStudents) * 100, 2) : 0,
        ];
    }
}