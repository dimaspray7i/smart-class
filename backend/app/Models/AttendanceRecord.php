<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    use HasFactory;

    protected $table = 'attendance_records';

    protected $fillable = [
        'student_id',
        'attendance_session_id',
        'verification_code',
        'face_verified',
        'face_score',
        'selfie_photo',
        'latitude',
        'longitude',
        'accuracy',
        'distance_from_school',
        'location_verified',
        'device_info',
        'browser_info',
        'ip_address',
        'status',
    ];

    protected $casts = [
        'face_verified' => 'boolean',
        'location_verified' => 'boolean',
        'face_score' => 'integer',
        'accuracy' => 'integer',
        'distance_from_school' => 'integer',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }
}
