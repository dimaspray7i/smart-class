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
     * Get permissions for teacher with filters (Added to fix "Call to undefined method" error)
     */
    public function getPermissions(int $teacherId, array $filters = [], int $perPage = 15): array
    {
        try {
            // Get classes taught by this teacher to ensure they only see their students' permissions
            $classIds = DB::table('class_user')
                ->where('user_id', $teacherId)
                ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
                ->where('is_active', true)
                ->pluck('class_id');

            if ($classIds->isEmpty()) {
                return [
                    'success' => true,
                    'data' => [],
                    'meta' => ['current_page' => 1, 'per_page' => $perPage, 'total' => 0, 'last_page' => 1],
                ];
            }

            // Get student IDs from those classes
            $studentIds = DB::table('class_user')
                ->whereIn('class_id', $classIds)
                ->where('role_in_class', 'siswa')
                ->where('is_active', true)
                ->pluck('user_id');

            $query = Permission::whereIn('user_id', $studentIds)
                ->with(['student.user:id,name,email,avatar_url']);

            // Apply Filters
            if (!empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }
            if (!empty($filters['type'])) {
                $query->where('type', $filters['type']);
            }
            if (!empty($filters['class_id'])) {
                // Filter by specific class if provided
                $specificStudentIds = DB::table('class_user')
                    ->where('class_id', $filters['class_id'])
                    ->where('role_in_class', 'siswa')
                    ->pluck('user_id');
                $query->whereIn('user_id', $specificStudentIds);
            }

            $permissions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return [
                'success' => true,
                'data' => $permissions->items(),
                'meta' => [
                    'current_page' => $permissions->currentPage(),
                    'per_page' => $permissions->perPage(),
                    'total' => $permissions->total(),
                    'last_page' => $permissions->lastPage(),
                ],
            ];

        } catch (Exception $e) {
            Log::error('PermissionService::getPermissions failed', [
                'teacher_id' => $teacherId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memuat data izin.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get pending permissions for teacher (Legacy/Specific use case)
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
            
            // Assuming User model has a method to get current active class relationship
            // If not, adjust logic to find the active class via pivot table
            $currentClass = $user->classes()->wherePivot('is_active', true)->first();

            if (!$currentClass) {
                return [
                    'success' => false,
                    'message' => 'Anda belum terdaftar di kelas manapun.',
                    'code' => 'NO_CLASS',
                ];
            }

            // Find the teacher assigned as 'wali_kelas' or primary teacher for this class/student
            // Adjust logic based on your specific role_in_class structure
            $waliKelas = $currentClass->teachers()
                ->wherePivot('role_in_class', 'wali_kelas')
                ->first();
            
            // Fallback: If no specific wali_kelas, take the first teacher of the class
            if (!$waliKelas) {
                 $waliKelas = $currentClass->teachers()->first();
            }

            if (!$waliKelas) {
                return [
                    'success' => false,
                    'message' => 'Kelas Anda belum memiliki wali kelas atau pengajar.',
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

            // Security check: Ensure the teacher is authorized to approve this
            // Either they are the target teacher OR they teach the student's class
            $isAuthorized = $permission->teacher_id === $teacherId || 
                            $this->isTeacherOfStudent($teacherId, $permission->user_id);

            if (!$isAuthorized) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk approve permohonan ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            if ($permission->status !== 'pending') {
                return [
                    'success' => false,
                    'message' => 'Permohonan sudah diproses sebelumnya.',
                    'code' => 'ALREADY_PROCESSED',
                ];
            }

            $permission->update([
                'status' => 'approved',
                'approved_by' => $teacherId,
                'approved_at' => now(),
                'note' => $note,
            ]);

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

             // Security check
             $isAuthorized = $permission->teacher_id === $teacherId || 
                             $this->isTeacherOfStudent($teacherId, $permission->user_id);

            if (!$isAuthorized) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk reject permohonan ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            if ($permission->status !== 'pending') {
                return [
                    'success' => false,
                    'message' => 'Permohonan sudah diproses sebelumnya.',
                    'code' => 'ALREADY_PROCESSED',
                ];
            }

            $permission->update([
                'status' => 'rejected',
                'approved_by' => $teacherId, // Using approved_by field to track who processed it
                'approved_at' => now(),
                'note' => $reason,
            ]);

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
                    'type_label' => $permission->type_label ?? $permission->type,
                    'date_range' => $permission->date_from . ' - ' . $permission->date_to,
                    'duration_days' => \Carbon\Carbon::parse($permission->date_from)->diffInDays(\Carbon\Carbon::parse($permission->date_to)) + 1,
                    'reason' => $permission->reason,
                    'status' => $permission->status,
                    'status_color' => $this->getStatusColor($permission->status),
                    'note' => $permission->note,
                    'is_active' => $permission->status === 'approved' && \Carbon\Carbon::today()->between($permission->date_from, $permission->date_to),
                    'created_at' => $permission->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }

    /**
     * Helper: Check if teacher teaches the student
     */
    private function isTeacherOfStudent(int $teacherId, int $studentId): bool
    {
        $classIds = DB::table('class_user')
            ->where('user_id', $teacherId)
            ->whereIn('role_in_class', ['wali_kelas', 'guru_pengampu'])
            ->where('is_active', true)
            ->pluck('class_id')
            ->toArray();

        if (empty($classIds)) {
            return false;
        }

        return DB::table('class_user')
            ->whereIn('class_id', $classIds)
            ->where('user_id', $studentId)
            ->where('role_in_class', 'siswa')
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Helper: Get status color for UI
     */
    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'approved' => 'green',
            'rejected' => 'red',
            'pending' => 'yellow',
            default => 'gray',
        };
    }
}