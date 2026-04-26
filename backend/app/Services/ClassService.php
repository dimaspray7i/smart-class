<?php

namespace App\Services\Admin;

use App\Models\ClassModel;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class ClassService
{
    /**
     * Get paginated classes
     */
    public function all(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = ClassModel::query();

        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        if (!empty($filters['is_active'])) {
            $query->where('is_active', $filters['is_active'] === 'true');
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->orderBy('level')->orderBy('name')->paginate(15);
    }

    /**
     * Find class by ID
     */
    public function find(int $id): ?ClassModel
    {
        return ClassModel::with(['users', 'schedules', 'attendanceSessions'])->find($id);
    }

    /**
     * Create new class
     */
    public function create(array $data): array
    {
        try {
            $class = ClassModel::create([
                'name' => $data['name'],
                'level' => $data['level'],
                'slug' => Str::slug($data['name']),
                'description' => $data['description'] ?? null,
                'capacity' => $data['capacity'] ?? 36,
                'is_active' => $data['is_active'] ?? true,
            ]);

            return [
                'success' => true,
                'message' => 'Kelas berhasil dibuat.',
                'class' => $class,
            ];

        } catch (Exception $e) {
            Log::error('ClassService::create failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat kelas.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Update class
     */
    public function update(int $id, array $data): array
    {
        try {
            $class = ClassModel::find($id);

            if (!$class) {
                return [
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $class->update($data);

            return [
                'success' => true,
                'message' => 'Kelas berhasil diupdate.',
                'class' => $class->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('ClassService::update failed', [
                'class_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update kelas.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Delete class
     */
    public function delete(int $id): array
    {
        try {
            $class = ClassModel::find($id);

            if (!$class) {
                return [
                    'success' => false,
                    'message' => 'Kelas tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $class->delete();

            return [
                'success' => true,
                'message' => 'Kelas berhasil dihapus.',
            ];

        } catch (Exception $e) {
            Log::error('ClassService::delete failed', [
                'class_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghapus kelas.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }
}