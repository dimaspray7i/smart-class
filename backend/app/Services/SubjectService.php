<?php

namespace App\Services\Admin;

use App\Models\Subject;
use Illuminate\Support\Facades\Log;
use Exception;

class SubjectService
{
    public function all(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Subject::query();

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['is_active'])) {
            $query->where('is_active', $filters['is_active'] === 'true');
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->orderBy('code')->paginate(15);
    }

    public function find(int $id): ?Subject
    {
        return Subject::with('schedules')->find($id);
    }

    public function create(array $data): array
    {
        try {
            if (Subject::where('code', $data['code'])->exists()) {
                return [
                    'success' => false,
                    'message' => 'Kode mapel sudah digunakan.',
                    'code' => 'CODE_EXISTS',
                ];
            }

            $subject = Subject::create($data);

            return [
                'success' => true,
                'message' => 'Mapel berhasil dibuat.',
                'subject' => $subject,
            ];

        } catch (Exception $e) {
            Log::error('SubjectService::create failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal membuat mapel.', 'code' => 'SERVER_ERROR'];
        }
    }

    public function update(int $id, array $data): array
    {
        try {
            $subject = Subject::find($id);
            if (!$subject) {
                return ['success' => false, 'message' => 'Mapel tidak ditemukan.', 'code' => 'NOT_FOUND'];
            }

            $subject->update($data);
            return ['success' => true, 'message' => 'Mapel berhasil diupdate.', 'subject' => $subject->fresh()];

        } catch (Exception $e) {
            Log::error('SubjectService::update failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal update mapel.', 'code' => 'SERVER_ERROR'];
        }
    }

    public function delete(int $id): array
    {
        try {
            $subject = Subject::find($id);
            if (!$subject) {
                return ['success' => false, 'message' => 'Mapel tidak ditemukan.', 'code' => 'NOT_FOUND'];
            }

            $subject->delete();
            return ['success' => true, 'message' => 'Mapel berhasil dihapus.'];

        } catch (Exception $e) {
            Log::error('SubjectService::delete failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal menghapus mapel.', 'code' => 'SERVER_ERROR'];
        }
    }
}