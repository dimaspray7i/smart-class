<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpFoundation\Response;

// ⚠️ CATATAN: Throwable adalah global class, TIDAK PERLU di-import dengan 'use'
// Cukup gunakan \Throwable dengan backslash di function parameter

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ═══════════════════════════════════════════════════
        // REGISTER ALIAS MIDDLEWARE
        // ═══════════════════════════════════════════════════
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        // ═══════════════════════════════════════════════════
        // API MIDDLEWARE GROUP (FIXED FOR SANCTUM)
        // ═══════════════════════════════════════════════════
        $middleware->group('api', [
            // Sanctum middleware untuk stateful requests (SPA/frontend)
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // ═══════════════════════════════════════════════════
        // TRUST PROXIES (for deployment behind nginx/load balancer)
        // ═══════════════════════════════════════════════════
        $middleware->trustProxies(at: '*');

        // ═══════════════════════════════════════════════════
        // CSRF CONFIGURATION (API routes excluded)
        // ═══════════════════════════════════════════════════
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // ═══════════════════════════════════════════════════
        // GLOBAL EXCEPTION HANDLING FOR API
        // ═══════════════════════════════════════════════════
        $exceptions->render(function (\Throwable $e, $request) {
            // Force JSON response for all API errors
            if ($request->is('api/*')) {
                $statusCode = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException
                    ? $e->getStatusCode()
                    : Response::HTTP_INTERNAL_SERVER_ERROR;

                return response()->json([
                    'status' => 'error',
                    'message' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan pada server.',
                    'code' => 'SERVER_ERROR',
                    'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                ], $statusCode);
            }
        });

        // Handle 404 Not Found
        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Endpoint tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ], Response::HTTP_NOT_FOUND);
            }
        });

        // Handle 403 Forbidden
        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Akses ditolak.',
                    'code' => 'FORBIDDEN',
                ], Response::HTTP_FORBIDDEN);
            }
        });

        // Handle Validation Errors (422)
        $exceptions->renderable(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal.',
                    'code' => 'VALIDATION_ERROR',
                    'errors' => $e->errors(),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        });

        // Handle Authentication Errors (401)
        $exceptions->renderable(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated. Silakan login terlebih dahulu.',
                    'code' => 'UNAUTHENTICATED',
                ], Response::HTTP_UNAUTHORIZED);
            }
        });
    })->create();