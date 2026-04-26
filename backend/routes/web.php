<?php

use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════════════════
// SPA FALLBACK ROUTE
// ═══════════════════════════════════════════════════════════
// All web routes will be handled by React/Vue frontend
// This is just a fallback for API testing

Route::get('/', function () {
    return response()->json([
        'message' => 'RPL Smart Ecosystem API',
        'version' => '1.0.0',
        'frontend' => 'http://localhost:5173',
        'api_docs' => '/api/health',
    ]);
});

Route::get('/api', function () {
    return redirect('/api/health');
});