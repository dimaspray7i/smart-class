<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\PermissionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    public function __construct(protected PermissionService $permissionService)
    {
        //
    }

    /**
     * Get pending permissions
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $permissions = $this->permissionService->getPending(
            $request->user()->id,
            $request->only(['type'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Permohonan izin berhasil diambil.',
            'code' => 'PERMISSIONS_SUCCESS',
            'data' => $permissions,
            'meta' => [
                'current_page' => $permissions->currentPage(),
                'per_page' => $permissions->perPage(),
                'total' => $permissions->total(),
                'last_page' => $permissions->lastPage(),
            ],
        ], 200);
    }

    /**
     * Approve permission
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $result = $this->permissionService->approve(
            $id,
            $request->user()->id,
            $request->input('note')
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'APPROVE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'APPROVE_SUCCESS',
            'data' => $result['permission'],
        ], 200);
    }

    /**
     * Reject permission
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $result = $this->permissionService->reject(
            $id,
            $request->user()->id,
            $request->input('reason')
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'REJECT_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'REJECT_SUCCESS',
            'data' => $result['permission'],
        ], 200);
    }

    /**
     * Submit permission request (for students)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $result = $this->permissionService->submit(
            $request->user()->id,
            $request->validate([
                'date_from' => 'required|date|after_or_equal:today',
                'date_to' => 'required|date|after_or_equal:date_from',
                'type' => 'required|in:Izin,Sakit',
                'reason' => 'required|string|max:1000',
                'attachment_url' => 'nullable|string|max:500',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'SUBMIT_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'SUBMIT_SUCCESS',
            'data' => $result['permission'],
        ], 201);
    }

    /**
     * Get student's permission history
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        $history = $this->permissionService->getStudentHistory($request->user()->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Riwayat izin berhasil diambil.',
            'code' => 'HISTORY_SUCCESS',
            'data' => $history,
        ], 200);
    }
}