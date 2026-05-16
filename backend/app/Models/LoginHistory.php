<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginHistory extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'login_successful',
        'failure_reason',
        'two_factor_used',
        'device_id',
        'retro_theme_used',
    ];

    protected $casts = [
        'login_successful' => 'boolean',
        'two_factor_used' => 'boolean',
        'retro_theme_used' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Scope: Successful logins only
     */
    public function scopeSuccessful($query)
    {
        return $query->where('login_successful', true);
    }

    /**
     * Scope: Failed logins only
     */
    public function scopeFailed($query)
    {
        return $query->where('login_successful', false);
    }

    /**
     * Scope: Logins with 2FA
     */
    public function scopeWith2FA($query)
    {
        return $query->where('two_factor_used', true);
    }

    /**
     * Scope: Retro theme logins
     */
    public function scopeRetroTheme($query)
    {
        return $query->where('retro_theme_used', true);
    }
}