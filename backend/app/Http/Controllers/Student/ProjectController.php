<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Services\ProjectService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProjectController extends Controller
{
    public function __construct(protected ProjectService $projectService)
    {
        //
    }

    /**
     * Get user's projects
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $projects = $this->projectService->getUserProjects(
            $request->user()->id,
            $request->only(['status', 'visibility', 'search'])
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Project berhasil diambil.',
            'code' => 'PROJECTS_SUCCESS',
            'data' => $projects,
            'meta' => [
                'current_page' => $projects->currentPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total(),
                'last_page' => $projects->lastPage(),
            ],
        ], 200);
    }

    /**
     * Create new project
     * 
     * @param StoreProjectRequest $request
     * @return JsonResponse
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $result = $this->projectService->create(
            $request->user()->id,
            $request->validated()
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'CREATE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'CREATE_SUCCESS',
            'data' => $result['project'],
        ], 201);
    }

    /**
     * Get project detail
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $project = $this->projectService->find($id);

        if (!$project) {
            return response()->json([
                'status' => 'error',
                'message' => 'Project tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Verify ownership
        if ($project->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak memiliki akses ke project ini.',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Project berhasil diambil.',
            'code' => 'PROJECT_SUCCESS',
            'data' => $project,
        ], 200);
    }

    /**
     * Update project
     * 
     * @param UpdateProjectRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateProjectRequest $request, int $id): JsonResponse
    {
        $project = $this->projectService->find($id);

        if (!$project) {
            return response()->json([
                'status' => 'error',
                'message' => 'Project tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Verify ownership
        if ($project->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak memiliki akses ke project ini.',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        $result = $this->projectService->update($id, $request->validated());

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'UPDATE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'UPDATE_SUCCESS',
            'data' => $result['project'],
        ], 200);
    }

    /**
     * Delete project
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $project = $this->projectService->find($id);

        if (!$project) {
            return response()->json([
                'status' => 'error',
                'message' => 'Project tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Verify ownership
        if ($project->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak memiliki akses ke project ini.',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        $result = $this->projectService->delete($id);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'DELETE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'DELETE_SUCCESS',
        ], 200);
    }

    /**
     * Get project coding logs
     * 
     * @param int $project
     * @param Request $request
     * @return JsonResponse
     */
    public function logs(int $project, Request $request): JsonResponse
    {
        $projectModel = $this->projectService->find($project);

        if (!$projectModel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Project tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Verify ownership
        if ($projectModel->user_id !== auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak memiliki akses ke project ini.',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        $logs = $this->projectService->getLogs($project, $request->only(['user_id']));

        return response()->json([
            'status' => 'success',
            'message' => 'Coding logs berhasil diambil.',
            'code' => 'LOGS_SUCCESS',
            'data' => $logs,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ], 200);
    }

    /**
     * Add coding log to project
     * 
     * @param int $project
     * @param Request $request
     * @return JsonResponse
     */
    public function storeLog(int $project, Request $request): JsonResponse
    {
        $result = $this->projectService->addLog(
            $project,
            $request->user()->id,
            $request->validate([
                'commit_hash' => 'nullable|string|max:255',
                'branch_name' => 'nullable|string|max:100',
                'description' => 'required|string|max:1000',
                'lines_added' => 'nullable|integer|min:0',
                'lines_deleted' => 'nullable|integer|min:0',
                'files_changed' => 'nullable|array',
            ])
        );

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'LOG_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'LOG_SUCCESS',
            'data' => $result['log'],
        ], 201);
    }
}