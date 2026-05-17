<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Device extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'ip_address',
        'user_agent',
        'last_used_at',
        'is_trusted',
        'retro_theme_enabled',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
        'is_trusted' => 'boolean',
        'retro_theme_enabled' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if device is recently active (last 30 days)
     */
    public function isRecentlyActive(): bool
    {
        return $this->last_used_at?->gt(now()->subDays(30)) ?? false;
    }

    /**
     * Get device type from user agent (simplified)
     */
    public function getDeviceTypeAttribute(): string
    {
        $ua = $this->user_agent ?? '';
        
        if (stripos($ua, 'mobile') !== false || stripos($ua, 'android') !== false || stripos($ua, 'iphone') !== false) {
            return 'mobile';
        }
        if (stripos($ua, 'tablet') !== false || stripos($ua, 'ipad') !== false) {
            return 'tablet';
        }
        return 'desktop';
    }

    /**
     * Get retro-friendly device name
     */
    public function getRetroNameAttribute(): string
    {
        $name = $this->name ?? 'Unknown Device';
        $type = $this->getDeviceTypeAttribute();
        
        $icons = [
            'mobile' => '📱',
            'tablet' => '📟',
            'desktop' => '💻',
        ];
        
        $icon = $icons[$type] ?? '🖥️';
        return "{$icon} {$name}";
    }
}