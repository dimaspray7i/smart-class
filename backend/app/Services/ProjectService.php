<?php

namespace App\Services;

use App\Models\Project;
use App\Models\CodingLog;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class ProjectService
{
    /**
     * Get user's projects with pagination
     */
    public function getUserProjects(int $userId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = Project::where('user_id', $userId);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['visibility'])) {
            $query->where('visibility', $filters['visibility'] === 'public');
        }

        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->withCount('logs')->orderBy('created_at', 'desc')->paginate(10);
    }

    /**
     * Create new project
     */
    public function create(int $userId, array $data): array
    {
        try {
            $project = Project::create([
                'user_id' => $userId,
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'description' => $data['description'],
                'repository_url' => $data['repository_url'] ?? null,
                'demo_url' => $data['demo_url'] ?? null,
                'status' => $data['status'] ?? 'planning',
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'tags' => $data['tags'] ?? [],
                'visibility' => $data['visibility'] ?? true,
            ]);

            return [
                'success' => true,
                'message' => 'Project berhasil dibuat.',
                'project' => $project,
            ];

        } catch (Exception $e) {
            Log::error('ProjectService::create failed', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal membuat project.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Find project by ID
     */
    public function find(int $id): ?Project
    {
        return Project::with(['user', 'logs' => function ($query) {
            $query->with('user:id,name,avatar_url')->latest()->limit(10);
        }])->find($id);
    }

    /**
     * Update project
     */
    public function update(int $id, array $data): array
    {
        try {
            $project = Project::find($id);

            if (!$project) {
                return [
                    'success' => false,
                    'message' => 'Project tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $project->update($data);

            return [
                'success' => true,
                'message' => 'Project berhasil diupdate.',
                'project' => $project->fresh(),
            ];

        } catch (Exception $e) {
            Log::error('ProjectService::update failed', [
                'project_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal update project.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Delete project
     */
    public function delete(int $id): array
    {
        try {
            $project = Project::find($id);

            if (!$project) {
                return [
                    'success' => false,
                    'message' => 'Project tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $project->delete();

            return [
                'success' => true,
                'message' => 'Project berhasil dihapus.',
            ];

        } catch (Exception $e) {
            Log::error('ProjectService::delete failed', [
                'project_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menghapus project.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get coding logs for project
     */
    public function getLogs(int $projectId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = CodingLog::where('project_id', $projectId);

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        return $query->with('user:id,name,avatar_url')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
    }

    /**
     * Add coding log to project
     */
    public function addLog(int $projectId, int $userId, array $data): array
    {
        try {
            $project = Project::find($projectId);

            if (!$project) {
                return [
                    'success' => false,
                    'message' => 'Project tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            // Verify user owns the project
            if ($project->user_id !== $userId) {
                return [
                    'success' => false,
                    'message' => 'Tidak memiliki akses ke project ini.',
                    'code' => 'FORBIDDEN',
                ];
            }

            $log = CodingLog::create([
                'project_id' => $projectId,
                'user_id' => $userId,
                'commit_hash' => $data['commit_hash'] ?? null,
                'branch_name' => $data['branch_name'] ?? 'main',
                'description' => $data['description'],
                'lines_added' => $data['lines_added'] ?? null,
                'lines_deleted' => $data['lines_deleted'] ?? null,
                'files_changed' => $data['files_changed'] ?? [],
            ]);

            return [
                'success' => true,
                'message' => 'Coding log berhasil ditambahkan.',
                'log' => $log,
            ];

        } catch (Exception $e) {
            Log::error('ProjectService::addLog failed', [
                'project_id' => $projectId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal menambahkan log.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get project statistics
     */
    public function getStats(int $userId): array
    {
        $total = Project::where('user_id', $userId)->count();
        $completed = Project::where('user_id', $userId)->where('status', 'completed')->count();
        $inProgress = Project::where('user_id', $userId)->where('status', 'in_progress')->count();

        $totalCommits = CodingLog::where('user_id', $userId)
            ->join('projects', 'coding_logs.project_id', '=', 'projects.id')
            ->count();

        $totalLines = CodingLog::where('user_id', $userId)
            ->join('projects', 'coding_logs.project_id', '=', 'projects.id')
            ->selectRaw('SUM(lines_added) as added, SUM(lines_deleted) as deleted')
            ->first();

        return [
            'projects' => [
                'total' => $total,
                'completed' => $completed,
                'in_progress' => $inProgress,
                'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
            ],
            'coding' => [
                'total_commits' => $totalCommits,
                'lines_added' => $totalLines->added ?? 0,
                'lines_deleted' => $totalLines->deleted ?? 0,
                'net_lines' => ($totalLines->added ?? 0) - ($totalLines->deleted ?? 0),
            ],
        ];
    }
}