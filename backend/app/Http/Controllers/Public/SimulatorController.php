<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Simulator\StartSessionRequest;
use App\Http\Requests\Simulator\SubmitChoiceRequest;
use App\Services\SimulatorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SimulatorController extends Controller
{
    public function __construct(protected SimulatorService $simulatorService)
    {
        //
    }

    /**
     * Get all career paths
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        // Check feature flag
        if (!config('app.feature_enable_simulator_public', true)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Career simulator sedang tidak tersedia.',
                'code' => 'FEATURE_DISABLED',
            ], 503);
        }

        $paths = $this->simulatorService->getPaths();

        return response()->json([
            'status' => 'success',
            'message' => 'Jalur karir berhasil diambil.',
            'code' => 'PATHS_SUCCESS',
            'data' => $paths,
        ], 200);
    }

    /**
     * Get career path detail by slug
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function show(string $slug): JsonResponse
    {
        $path = $this->simulatorService->getPathBySlug($slug);

        if (!$path) {
            return response()->json([
                'status' => 'error',
                'message' => 'Jalur karir tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail jalur karir berhasil diambil.',
            'code' => 'PATH_SUCCESS',
            'data' => $path,
        ], 200);
    }

    /**
     * Start new simulator session
     * 
     * @param StartSessionRequest $request
     * @return JsonResponse
     */
    public function startSession(StartSessionRequest $request): JsonResponse
    {
        $result = $this->simulatorService->createSession($request->validated());

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'SESSION_FAILED',
            ], 400);
        }

        $statusCode = $result['resumed'] ?? false ? 200 : 201;

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => $result['resumed'] ?? false ? 'SESSION_RESUMED' : 'SESSION_CREATED',
            'data' => $result['session'],
        ], $statusCode);
    }

    /**
     * Submit choice in simulator
     * 
     * @param string $sessionId
     * @param SubmitChoiceRequest $request
     * @return JsonResponse
     */
    public function submitChoice(string $sessionId, SubmitChoiceRequest $request): JsonResponse
    {
        $result = $this->simulatorService->processChoice($sessionId, $request->validated());

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CHOICE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => $result['is_end'] ?? false ? 'SIMULATOR_COMPLETED' : 'CHOICE_SUCCESS',
            'data' => $result['data'],
        ], 200);
    }

    /**
     * Get session result
     * 
     * @param string $sessionId
     * @return JsonResponse
     */
    public function getResult(string $sessionId): JsonResponse
    {
        $result = $this->simulatorService->getResult($sessionId);

        if (!$result) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sesi tidak ditemukan atau belum selesai.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Hasil simulator berhasil diambil.',
            'code' => 'RESULT_SUCCESS',
            'data' => $result,
        ], 200);
    }
}