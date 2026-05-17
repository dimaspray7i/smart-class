<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Schedule extends Model
{
    use HasFactory;

    /**
     * Standard time periods for the school
     */
    public const PERIODS = [
        ['start' => '07:15', 'end' => '08:05', 'label' => 'Jam ke-1'],
        ['start' => '08:05', 'end' => '08:55', 'label' => 'Jam ke-2'],
        ['start' => '08:55', 'end' => '09:45', 'label' => 'Jam ke-3'],
        ['start' => '09:45', 'end' => '10:15', 'label' => 'ISTIRAHAT 1', 'is_break' => true],
        ['start' => '10:15', 'end' => '11:05', 'label' => 'Jam ke-4'],
        ['start' => '11:05', 'end' => '11:55', 'label' => 'Jam ke-5'],
        ['start' => '11:55', 'end' => '12:45', 'label' => 'ISTIRAHAT 2', 'is_break' => true],
        ['start' => '12:45', 'end' => '13:35', 'label' => 'Jam ke-6'],
        ['start' => '13:35', 'end' => '14:25', 'label' => 'Jam ke-7'],
        ['start' => '14:25', 'end' => '15:15', 'label' => 'Jam ke-8'],
    ];

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'class_id',
        'subject_id',
        'teacher_id',
        'day',
        'start_time',
        'end_time',
        'room',
        'is_active',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'is_active' => 'boolean',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Schedule belongs to a class
     */
    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    /**
     * Schedule belongs to a subject
     */
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    /**
     * Schedule belongs to a teacher
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by day
     */
    public function scopeDay($query, string $day)
    {
        return $query->where('day', $day);
    }

    /**
     * Scope: Filter by class
     */
    public function scopeForClass($query, int $classId)
    {
        return $query->where('class_id', $classId);
    }

    /**
     * Scope: Filter by teacher
     */
    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Scope: Active schedules only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Today's schedules
     */
    public function scopeToday($query)
    {
        $day = strtolower(now()->locale('id')->dayName);
        if ($day === 'minggu') {
            $day = 'senin'; // Fallback for Sunday testing
        }
        return $query->where('day', $day);
    }

    /**
     * Scope: Search by class, subject, or teacher name
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function($q) use ($search) {
            $q->whereHas('class', fn($sq) => $sq->where('name', 'like', "%{$search}%"))
              ->orWhereHas('subject', fn($sq) => $sq->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"))
              ->orWhereHas('teacher', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
        });
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get day name in Indonesian
     */
    public function getDayNameAttribute(): string
    {
        $days = [
            'senin' => 'Senin',
            'selasa' => 'Selasa',
            'rabu' => 'Rabu',
            'kamis' => 'Kamis',
            'jumat' => 'Jumat',
            'sabtu' => 'Sabtu',
        ];

        return $days[$this->day] ?? $this->day;
    }

    /**
     * Accessor: Get formatted time range
     */
    public function getTimeRangeAttribute(): string
    {
        $start = Carbon::parse($this->start_time)->format('H:i');
        $end = Carbon::parse($this->end_time)->format('H:i');

        return "{$start} - {$end}";
    }

    /**
     * Accessor: Get duration in minutes
     */
    public function getDurationAttribute(): int
    {
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);

        return $start->diffInMinutes($end);
    }

    /**
     * Accessor: Check if class is currently happening
     */
    public function getIsNowAttribute(): bool
    {
        $now = now();
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);

        return $now->between($start, $end);
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Check if schedule conflicts with another
     */
    public function conflictsWith(Schedule $other): bool
    {
        if ($this->day !== $other->day) {
            return false;
        }

        if ($this->teacher_id === $other->teacher_id) {
            // Same teacher, check time overlap
            return $this->timeOverlaps($other);
        }

        if ($this->class_id === $other->class_id) {
            // Same class, check time overlap
            return $this->timeOverlaps($other);
        }

        return false;
    }

    /**
     * Check if time ranges overlap
     */
    private function timeOverlaps(Schedule $other): bool
    {
        $thisStart = Carbon::parse($this->start_time);
        $thisEnd = Carbon::parse($this->end_time);
        $otherStart = Carbon::parse($other->start_time);
        $otherEnd = Carbon::parse($other->end_time);

        return $thisStart->lt($otherEnd) && $thisEnd->gt($otherStart);
    }
}