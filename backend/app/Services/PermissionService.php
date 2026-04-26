<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class PermissionService
{
    /**
     * Get pending permissions for teacher
     */
    public function getPending(int $teacherId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Permission::where('teacher_id', $teacherId)
            ->where('status', 'pending')
            ->with('student:id,name,email,avatar_url');

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    /**
     * Submit permission request (student)
     */
    public function submit(int $userId, array $data): array
    {
        try {
            // Get student's class and wali kelas
            $user = User::find($userId);
            $currentClass = $user->getCurrentClass();

            if (!$currentClass) {
                return [
                    'success' => false,
                    'message' => 'Anda belum terdaftar di kelas manapun.',
                    'code' => 'NO_CLASS',
                ];
            }

            $waliKelas = $currentClass->waliKelas()->first();

            if (!$waliKelas) {
                return [
                    'success' => false,
                    'message' => 'Kelas Anda belum memiliki wali kelas.',
                    'code' => 'NO_WALI_KELAS',
                ];
            }

            $permission = Permission::create([
                'user_id' => $userId,
                'teacher_id' => $waliKelas->id,
                'date_from' => $data['date_from'],
                'date_to' => $data['date_to'],
                'type' => $data['type'],
                'reason' => $data['reason'],
                'attachment_url' => $data['attachment_url'] ?? null,
                'status' => 'pending',
            ]);

            return [
                'success' => true,
                'message' => 'Permohonan izin berhasil dikirim.',
                'permission' => $permission,
            ];

        } catch (Exception $e) {
            Log::error('PermissionService::submit failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal mengirim permohonan izin.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Approve permission
     */
    public function approve(int $permissionId, int $teacherId, ?string $note = null): array
    {
        try {
            $permission = Permission::find($permissionId);

            if (!$permission) {
                return [
                    'success' => false,
                    'message' => 'Permohonan tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            if ($permission->teacher_id !== $teacherId) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk approve permohonan ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            if (!$permission->canBeProcessed()) {
                return [
                    'success' => false,
                    'message' => 'Permohonan sudah diproses.',
                    'code' => 'ALREADY_PROCESSED',
                ];
            }

            $permission->approve($teacherId, $note);

            return [
                'success' => true,
                'message' => 'Permohonan izin disetujui.',
                'permission' => $permission->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('PermissionService::approve failed', [
                'permission_id' => $permissionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menyetujui permohonan.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Reject permission
     */
    public function reject(int $permissionId, int $teacherId, ?string $reason = null): array
    {
        try {
            $permission = Permission::find($permissionId);

            if (!$permission) {
                return [
                    'success' => false,
                    'message' => 'Permohonan tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            if ($permission->teacher_id !== $teacherId) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk reject permohonan ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            if (!$permission->canBeProcessed()) {
                return [
                    'success' => false,
                    'message' => 'Permohonan sudah diproses.',
                    'code' => 'ALREADY_PROCESSED',
                ];
            }

            $permission->reject($teacherId, $reason);

            return [
                'success' => true,
                'message' => 'Permohonan izin ditolak.',
                'permission' => $permission->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('PermissionService::reject failed', [
                'permission_id' => $permissionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menolak permohonan.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get student's permission history
     */
    public function getStudentHistory(int $userId): array
    {
        return Permission::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'type' => $permission->type,
                    'type_label' => $permission->type_label,
                    'date_range' => $permission->date_range,
                    'duration_days' => $permission->duration_days,
                    'reason' => $permission->reason,
                    'status' => $permission->status,
                    'status_color' => $permission->status_color,
                    'note' => $permission->note,
                    'is_active' => $permission->is_active,
                    'created_at' => $permission->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }
}