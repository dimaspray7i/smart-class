<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Permission extends Model
{
    use HasFactory;

    /**
     * Attributes yang dapat di-mass-assign
     */
    protected $fillable = [
        'user_id',
        'teacher_id',
        'date_from',
        'date_to',
        'type',
        'reason',
        'attachment_url',
        'status',
        'note',
        'approved_at',
    ];

    /**
     * Attributes yang harus di-cast
     */
    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'approved_at' => 'datetime',
        ];
    }

    // ═══════════════════════════════════════════════════════════
    // RELATIONSHIPS
    // ═══════════════════════════════════════════════════════════

    /**
     * Permission belongs to a student (user)
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Permission belongs to a teacher (approver)
     */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    // ═══════════════════════════════════════════════════════════
    // SCOPES
    // ═══════════════════════════════════════════════════════════

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Pending permissions only
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope: Approved permissions only
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope: Rejected permissions only
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope: For specific student
     */
    public function scopeForStudent($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: For specific teacher
     */
    public function scopeForTeacher($query, int $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Scope: Active date range (today is between date_from and date_to)
     */
    public function scopeActive($query)
    {
        return $query->where('date_from', '<=', today())
            ->where('date_to', '>=', today());
    }

    // ═══════════════════════════════════════════════════════════
    // ACCESSORS
    // ═══════════════════════════════════════════════════════════

    /**
     * Accessor: Get type label in Indonesian
     */
    public function getTypeLabelAttribute(): string
    {
        $labels = [
            'Izin' => 'Izin',
            'Sakit' => 'Sakit',
        ];

        return $labels[$this->type] ?? $this->type;
    }

    /**
     * Accessor: Get status label with color
     */
    public function getStatusColorAttribute(): string
    {
        $colors = [
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
        ];

        return $colors[$this->status] ?? 'gray';
    }

    /**
     * Accessor: Get duration in days
     */
    public function getDurationDaysAttribute(): int
    {
        return Carbon::parse($this->date_from)
            ->diffInDays(Carbon::parse($this->date_to)) + 1;
    }

    /**
     * Accessor: Check if permission is currently active
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'approved'
            && today()->between($this->date_from, $this->date_to);
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Approve permission
     */
    public function approve(int $teacherId, ?string $note = null): void
    {
        $this->update([
            'status' => 'approved',
            'teacher_id' => $teacherId,
            'note' => $note,
            'approved_at' => now(),
        ]);
    }

    /**
     * Reject permission
     */
    public function reject(int $teacherId, ?string $reason = null): void
    {
        $this->update([
            'status' => 'rejected',
            'teacher_id' => $teacherId,
            'note' => $reason,
            'approved_at' => now(),
        ]);
    }

    /**
     * Check if permission can be approved/rejected
     */
    public function canBeProcessed(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Get date range formatted
     */
    public function getDateRangeAttribute(): string
    {
        $from = Carbon::parse($this->date_from)->format('d M Y');
        $to = Carbon::parse($this->date_to)->format('d M Y');

        return $from === $to ? $from : "{$from} - {$to}";
    }
}