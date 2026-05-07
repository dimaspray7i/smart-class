<?php

use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════════════════
// SPA FALLBACK ROUTE
// ═══════════════════════════════════════════════════════════
// All web routes will be handled by React/Vue frontend
// This is just a fallback for API testing

Route::get('/', function () {
    return response()->json([
        'message' => 'RPL Smart API',
        'version' => '1.0.0',
        'frontend' => 'http://localhost:5173',
        'api_docs' => '/api/health',
    ]);
});

Route::get('/api', function () {
    return redirect('/api/health');
});

// ═══════════════════════════════════════════════════════════
// LOGIN ROUTE (Named for middleware redirect)
// ═══════════════════════════════════════════════════════════
// This route is used by Auth middleware for redirects
// For API requests, this won't actually redirect (handled in exception)
Route::get('/login', function () {
    return response()->json([
        'status' => 'error',
        'message' => 'Authentication required. Please login.',
        'code' => 'UNAUTHENTICATED',
    ], 401);
})->name('login');