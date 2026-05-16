<?php

// ═══════════════════════════════════════════════════════════
// 🎨 RPL SMART ECOSYSTEM - RETRO FUTURISTIC EDITION
// Config: app.php | Version: 2.0.0-retro
// Theme: Y2K / Cyber / Sticker-Bomb Aesthetic 🚀✨
// ═══════════════════════════════════════════════════════════

return [

    /*
    |--------------------------------------------------------------------------
    | 🏷️ Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    | 🎮 Retro Tip: This name appears in emails, logs, and console output!
    |
    */

    'name' => env('APP_NAME', 'RPL Smart Ecosystem'),

    /*
    |--------------------------------------------------------------------------
    | 🌍 Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    | 🎮 Options: local, staging, production
    | 💡 Retro Mode: Set APP_ENV=local for detailed error messages!
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | 🐛 Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    | ⚠️ WARNING: Never enable debug mode in production!
    | 🎮 Retro Tip: Debug mode shows awesome stack traces for debugging ✨
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | 🔗 Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    | 🎮 Set this to your domain: https://rpl-smart.sch.id
    | 💡 For local dev: http://localhost or http://rpl-smart.test
    |
    */

    'url' => env('APP_URL', 'http://localhost'),

    'asset_url' => env('ASSET_URL'),

    /*
    |--------------------------------------------------------------------------
    | 🕐 Application Timezone ⭐ IMPORTANT FOR RETRO TIMESTAMP!
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. 
    |
    | 🇮🇩 INDONESIA TIMEZONES:
    |   • 'Asia/Jakarta'    → WIB  (UTC+7)  ← DEFAULT FOR THIS PROJECT!
    |   • 'Asia/Makassar'   → WITA (UTC+8)
    |   • 'Asia/Jayapura'   → WIT  (UTC+9)
    |
    | 🌍 OTHER COMMON TIMEZONES:
    |   • 'UTC'             → Coordinated Universal Time
    |   • 'America/New_York' → EST/EDT
    |   • 'Europe/London'   → GMT/BST
    |   • 'Asia/Tokyo'      → JST
    |
    | 🎮 Retro Tip: All timestamps in API responses will use this timezone!
    | 💡 Change via .env: APP_TIMEZONE=Asia/Jakarta
    |
    */

    'timezone' => env('APP_TIMEZONE', 'Asia/Jakarta'),

    /*
    |--------------------------------------------------------------------------
    | 🗣️ Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    | 🇮🇩 INDONESIA LOCALES:
    |   • 'id'    → Bahasa Indonesia (DEFAULT FOR THIS PROJECT!)
    |   • 'jv'    → Javanese
    |   • 'su'    → Sundanese
    |
    | 🌍 OTHER COMMON LOCALES:
    |   • 'en'    → English
    |   • 'en_US' → English (United States)
    |   • 'en_GB' → English (United Kingdom)
    |
    | 🎮 Retro Tip: Dates, numbers, and messages will use this locale!
    | 💡 Change via .env: APP_LOCALE=id
    |
    */

    'locale' => env('APP_LOCALE', 'id'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'id_ID'),

    /*
    |--------------------------------------------------------------------------
    | 🔐 Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    | ⚠️ SECURITY: Never share or commit this key to version control!
    | 🎮 Generated via: php artisan key:generate
    | 💡 Retro Mode: Key is auto-generated on first install ✨
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', ''))
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | 🔧 Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    | 🎮 Retro Tip: Use "cache" driver for multi-server deployments!
    | 💡 Activate via: php artisan down --render="retro"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

    /*
    |--------------------------------------------------------------------------
    | 🎨 RETRO FUTURISTIC EXTENSIONS (Custom Config)
    |--------------------------------------------------------------------------
    |
    | Additional configuration options for the Retro Futuristic theme.
    | These are custom additions for RPL Smart Ecosystem v2.0-retro.
    |
    */

    // Retro Theme Settings
    'retro' => [
        'enabled' => env('RETRO_THEME_ENABLED', true),
        'version' => '2.0.0',
        'palette' => [
            'primary' => env('RETRO_PRIMARY_COLOR', '#FF5C00'),    // Electric Orange
            'secondary' => env('RETRO_SECONDARY_COLOR', '#2E2BBF'), // Deep Royal Blue
            'accent' => env('RETRO_ACCENT_COLOR', '#FFC928'),      // Bright Yellow
            'background' => env('RETRO_BG_COLOR', '#FFF9E6'),      // Vintage Cream
            'text' => env('RETRO_TEXT_COLOR', '#111111'),          // Jet Black
        ],
        'fonts' => [
            'display' => env('RETRO_FONT_DISPLAY', '"Bebas Neue", "Anton", sans-serif'),
            'mono' => env('RETRO_FONT_MONO', '"Space Mono", "VT323", monospace'),
            'body' => env('RETRO_FONT_BODY', '"Inter", sans-serif'),
        ],
        'animations' => [
            'enabled' => env('RETRO_ANIMATIONS_ENABLED', true),
            'reduced_motion' => env('RETRO_REDUCED_MOTION', false),
        ],
    ],

    // API Response Settings
    'api' => [
        'default_format' => env('API_DEFAULT_FORMAT', 'json'),
        'include_timestamp' => env('API_INCLUDE_TIMESTAMP', true),
        'timestamp_format' => env('API_TIMESTAMP_FORMAT', 'iso8601'), // iso8601, datetime, unix
        'include_timezone' => env('API_INCLUDE_TIMEZONE', true),
        'max_pagination' => env('API_MAX_PAGINATION', 100),
        'default_pagination' => env('API_DEFAULT_PAGINATION', 15),
    ],

    // File Upload Settings
    'uploads' => [
        'avatar' => [
            'max_size' => env('UPLOAD_AVATAR_MAX_SIZE', 5), // MB
            'allowed_types' => ['image/jpeg', 'image/png', 'image/webp'],
            'path' => 'public/avatars',
        ],
        'documents' => [
            'max_size' => env('UPLOAD_DOCUMENT_MAX_SIZE', 10), // MB
            'allowed_types' => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'path' => 'public/documents',
        ],
    ],

    // Security Settings
    'security' => [
        'password_min_length' => env('SECURITY_PASSWORD_MIN_LENGTH', 8),
        'password_require_uppercase' => env('SECURITY_PASSWORD_UPPERCASE', true),
        'password_require_number' => env('SECURITY_PASSWORD_NUMBER', true),
        'password_require_special' => env('SECURITY_PASSWORD_SPECIAL', true),
        'session_lifetime' => env('SECURITY_SESSION_LIFETIME', 120), // minutes
        'max_login_attempts' => env('SECURITY_MAX_LOGIN_ATTEMPTS', 5),
        'lockout_duration' => env('SECURITY_LOCKOUT_DURATION', 30), // minutes
    ],

    // Feature Flags (Toggle features without code deploy)
    'features' => [
        'ai_recommendations' => env('FEATURE_AI_RECOMMENDATIONS', false),
        'whatsapp_integration' => env('FEATURE_WHATSAPP_INTEGRATION', false),
        'biometric_login' => env('FEATURE_BIOMETRIC_LOGIN', false),
        'realtime_notifications' => env('FEATURE_REALTIME_NOTIFICATIONS', true),
        'export_csv' => env('FEATURE_EXPORT_CSV', true),
        'export_json' => env('FEATURE_EXPORT_JSON', true),
    ],

];