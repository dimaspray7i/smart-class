<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
        // Middleware will handle auth & role checks
    }

    /**
     * Get paginated users with filters
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['role', 'is_active', 'search']);
        
        // Handle boolean conversion for is_active
        if (isset($filters['is_active'])) {
            $filters['is_active'] = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        $users = $this->userService->paginate($filters + ['all' => $request->has('all')]);

        $responseData = [
            'status' => 'success',
            'message' => 'User berhasil diambil.',
            'code' => 'USERS_SUCCESS',
            'data' => $request->has('all') ? $users : $users->items(),
        ];

        if (!$request->has('all')) {
            $responseData['meta'] = [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
                'from' => $users->firstItem(),
                'to' => $users->lastItem(),
            ];
        }

        return response()->json($responseData, 200);
    }

    /**
     * Get user detail by ID (with profile & subjects)
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Load relationships for detailed view
        $user->load([
            'profile', 
            'profile.subjects', 
            'classes' => function($q) {
                $q->withCount('students as students_count');
            },
            'taughtSchedules.class',
            'taughtSchedules.subject'
        ]);

        if ($user->role === 'guru') {
            // Get class IDs from class_user and from schedules, merge unique
            $classUserIds = $user->classes->pluck('id')->toArray();
            $scheduleClassIds = $user->taughtSchedules->pluck('class_id')->toArray();
            $allClassIds = array_values(array_unique(array_filter(array_merge($classUserIds, $scheduleClassIds))));

            $classes = \App\Models\ClassModel::whereIn('id', $allClassIds)
                ->withCount(['students as students_count'])
                ->get(['id', 'name', 'level', 'slug'])
                ->makeHidden(['wali_kelas', 'subject_count', 'available_capacity', 'is_full', 'teacher_count']);

            // Total unique students across those classes
            $totalStudents = \App\Models\User::where('role', 'siswa')
                ->whereHas('classes', fn($q) => $q->whereIn('classes.id', $allClassIds))
                ->distinct()
                ->count('users.id');

            // Subjects taught (from profile)
            $subjects = $user->profile?->subjects?->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'code' => $s->code ?? null,
            ])->values()->toArray() ?? [];

            // Recent schedules for today
            $day = strtolower(now()->locale('id')->dayName);
            if ($day === 'minggu') $day = 'senin';

            $recentSchedules = $user->taughtSchedules
                ->where('day', $day)
                ->where('is_active', true)
                ->sortBy('start_time')
                ->take(5)
                ->values()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'day' => $s->day,
                    'start_time' => $s->start_time,
                    'end_time' => $s->end_time,
                    'subject' => $s->subject ? ['id' => $s->subject->id, 'name' => $s->subject->name] : null,
                    'class' => $s->class ? ['id' => $s->class->id, 'name' => $s->class->name] : null,
                ])->toArray();

            $payload = [
                'teacher' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar_url' => $user->avatar_url,
                    'status' => $user->is_active ? 'active' : 'inactive',
                    'created_at' => $user->created_at,
                ],
                'profile' => $user->profile ? $user->profile->only(['nis', 'nip', 'class_level', 'major', 'bio']) : null,
                'subjects' => $subjects,
                'class_count' => count($allClassIds),
                'classes' => $classes->map(fn($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'level' => $c->level ?? null,
                    'students_count' => $c->students_count ?? 0,
                ])->values()->toArray(),
                'total_students' => (int) $totalStudents,
                'recent_schedules' => $recentSchedules,
            ];

            return response()->json([
                'status' => 'success',
                'message' => 'Detail guru berhasil diambil.',
                'code' => 'TEACHER_DETAIL_SUCCESS',
                'data' => $payload,
            ], 200);
        }

        // Non-teacher users: return simplified payload
        $payload = [
            'user' => $user->only(['id', 'name', 'email', 'phone', 'avatar_url', 'is_active', 'created_at']),
            'profile' => $user->profile ? $user->profile->only(['nis', 'nip', 'class_level', 'major', 'bio']) : null,
            'class_count' => $user->classes->count(),
            'classes' => $user->classes->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'students_count' => $c->students()->count(),
            ])->toArray(),
        ];

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil diambil.',
            'code' => 'USER_SUCCESS',
            'data' => $payload,
        ], 200);
    }

    /**
     * Create new user (ADMIN ONLY)
     */
    public function store(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('UserController::store request', [
            'role' => $request->input('role'),
            'subjects' => $request->input('subjects'),
            'has_file' => $request->hasFile('avatar')
        ]);

        $role = $request->input('role');
        
        // Base validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'string', 'min:8'],
            'role' => 'required|in:admin,guru,siswa',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            'avatar' => 'nullable|image|max:5120', // max 5MB
            
            // Profile fields (conditionally required)
            'nis' => $role === 'siswa' ? 'required|string|max:20|unique:profiles,nis' : 'nullable|string|max:20',
            'nip' => $role === 'guru' ? 'required|string|max:20|unique:profiles,nip' : 'nullable|string|max:20',
            'class_level' => $role === 'siswa' ? 'required|in:X,XI,XII' : 'nullable|in:X,XI,XII',
            'class_id' => $role === 'siswa' ? 'nullable|exists:classes,id' : 'nullable',
            
            // Teacher subjects (array of subject IDs)
            'subjects' => $role === 'guru' ? 'required|array|min:1' : 'nullable|array',
            'subjects.*' => $role === 'guru' ? 'exists:subjects,id' : 'nullable',
            
            // Optional profile fields
            'bio' => 'nullable|string|max:1000',
            'github_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
        ];

        // Custom error messages
        $messages = [
            'nis.required' => 'NIS wajib diisi untuk siswa.',
            'nis.unique' => 'NIS sudah terdaftar.',
            'nip.required' => 'NIP wajib diisi untuk guru.',
            'nip.unique' => 'NIP sudah terdaftar.',
            'class_level.required' => 'Kelas wajib dipilih untuk siswa.',
            'class_level.in' => 'Pilih kelas yang valid (X, XI, atau XII).',
            'subjects.required' => 'Minimal satu mata pelajaran wajib dipilih untuk guru.',
            'subjects.array' => 'Format mata pelajaran tidak valid.',
            'subjects.*.exists' => 'Terdapat mata pelajaran yang tidak valid.',
        ];

        $validated = $request->validate($rules, $messages);

        try {
            DB::beginTransaction();

            $result = $this->userService->create($validated);

            if (!$result['success']) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'CREATE_FAILED',
                    'errors' => $result['errors'] ?? null,
                ], 400);
            }

            // Handle avatar upload if provided
            if ($request->hasFile('avatar') && $result['user']) {
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $result['user']->update(['avatar_url' => asset('storage/' . $avatarPath)]);
            }

            // Attach subjects for teacher if provided
            if ($role === 'guru' && !empty($validated['subjects']) && $result['user']?->profile) {
                $result['user']->profile->subjects()->sync($validated['subjects']);
            }

            // Attach class for student if provided
            if ($role === 'siswa' && !empty($validated['class_id']) && $result['user']) {
                $result['user']->classes()->sync([
                    $validated['class_id'] => [
                        'role_in_class' => 'siswa',
                        'academic_year' => date('Y'),
                        'is_active' => true,
                    ]
                ]);
            }

            DB::commit();

            // Reload user with relationships for response
            $result['user']->load(['profile', 'profile.subjects', 'classes']);

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'CREATE_SUCCESS',
                'data' => $result['user'],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('UserController::store failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat user: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update existing user (ADMIN ONLY) - Email CAN be edited
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $role = $user->role;

        \Illuminate\Support\Facades\Log::info('UserController::update request', [
            'user_id' => $id,
            'role' => $role,
            'subjects' => $request->input('subjects'),
            'all_input' => $request->all()
        ]);
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $role = $request->input('role', $user->role);
        
        // Validation rules - email is editable (unique check excludes current user)
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'is_active' => 'nullable|boolean',
            'avatar' => 'nullable|image|max:5120', // max 5MB
            
            // Profile fields (conditionally validated)
            'nis' => $role === 'siswa' 
                ? 'sometimes|required|string|max:20|unique:profiles,nis,' . $id . ',user_id' 
                : 'nullable|string|max:20',
            'nip' => $role === 'guru' 
                ? 'sometimes|required|string|max:20|unique:profiles,nip,' . $id . ',user_id' 
                : 'nullable|string|max:20',
            'class_level' => 'nullable|in:X,XI,XII',
            'class_id' => $role === 'siswa' ? 'nullable|exists:classes,id' : 'nullable',
            
            // Teacher subjects (array of subject IDs)
            'subjects' => $role === 'guru' ? 'sometimes|required|array|min:1' : 'nullable|array',
            'subjects.*' => $role === 'guru' ? 'exists:subjects,id' : 'nullable',
            
            // Optional profile fields
            'bio' => 'nullable|string|max:1000',
            'github_url' => 'nullable|url|max:255',
            'linkedin_url' => 'nullable|url|max:255',
        ];

        $messages = [
            'email.unique' => 'Email sudah digunakan oleh user lain.',
            'nis.unique' => 'NIS sudah terdaftar.',
            'nip.unique' => 'NIP sudah terdaftar.',
            'subjects.required' => 'Minimal satu mata pelajaran wajib dipilih untuk guru.',
            'subjects.*.exists' => 'Terdapat mata pelajaran yang tidak valid.',
        ];

        $validated = $request->validate($rules, $messages);

        try {
            DB::beginTransaction();

            $result = $this->userService->update($id, $validated);

            if (!$result['success']) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => $result['message'],
                    'code' => $result['code'] ?? 'UPDATE_FAILED',
                    'errors' => $result['errors'] ?? null,
                ], 400);
            }

            // Handle avatar update if provided
            if ($request->hasFile('avatar') && $result['user']) {
                // Delete old avatar if exists
                if ($result['user']->avatar_url) {
                    $path = parse_url($result['user']->avatar_url, PHP_URL_PATH);
                    $storagePath = preg_replace('/^\/?storage\//', '', $path);
                    if (\Illuminate\Support\Facades\Storage::disk('public')->exists($storagePath)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($storagePath);
                    }
                }
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
                $result['user']->update(['avatar_url' => asset('storage/' . $avatarPath)]);
            }

            // Sync subjects for teacher if provided
            if ($role === 'guru' && isset($validated['subjects']) && $result['user']?->profile) {
                $result['user']->profile->subjects()->sync($validated['subjects']);
            }

            // Sync class for student if provided
            if ($role === 'siswa' && isset($validated['class_id']) && $result['user']) {
                $result['user']->classes()->sync([
                    $validated['class_id'] => [
                        'role_in_class' => 'siswa',
                        'academic_year' => date('Y'),
                        'is_active' => true,
                    ]
                ]);
            }

            DB::commit();

            // Reload user with relationships for response
            $result['user']->load(['profile', 'profile.subjects', 'classes']);

            return response()->json([
                'status' => 'success',
                'message' => $result['message'],
                'code' => 'UPDATE_SUCCESS',
                'data' => $result['user'],
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('UserController::update failed', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update user: ' . $e->getMessage(),
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Delete user(s) (ADMIN ONLY) - Support multiple IDs
     */
    public function destroy(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        
        // If single ID provided via route parameter, use it
        if (!$ids && $request->route('user')) {
            $ids = [$request->route('user')];
        }
        
        // Ensure we have IDs to delete
        if (empty($ids)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada user yang dipilih untuk dihapus.',
                'code' => 'NO_IDS_PROVIDED',
            ], 400);
        }
        
        // Prevent self-deletion
        if (in_array(auth()->id(), $ids)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menghapus akun sendiri.',
                'code' => 'SELF_DELETE_FORBIDDEN',
            ], 403);
        }

        $result = $this->userService->deleteMultiple($ids);

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
     * Export users to CSV/Excel
     */
    public function export(Request $request)
    {
        $filters = $request->only(['role', 'is_active', 'search']);
        
        // Handle boolean conversion for is_active
        if (isset($filters['is_active'])) {
            $filters['is_active'] = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // Get users data
        $users = $this->userService->getAllForExport($filters);

        // Generate CSV content
        $csvData = [];
        $csvData[] = ['ID', 'Name', 'Email', 'Role', 'Phone', 'Is Active', 'NIS', 'NIP', 'Class Level', 'Created At'];

        foreach ($users as $user) {
            $csvData[] = [
                $user->id,
                $user->name,
                $user->email,
                $user->role,
                $user->phone ?? '',
                $user->is_active ? 'Yes' : 'No',
                $user->profile->nis ?? '',
                $user->profile->nip ?? '',
                $user->profile->class_level ?? '',
                $user->created_at->format('Y-m-d H:i:s'),
            ];
        }

        // Create CSV string
        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= implode(',', array_map(function($field) {
                return '"' . str_replace('"', '""', $field) . '"';
            }, $row)) . "\n";
        }

        // Return as downloadable file
        return response($csvContent)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="users_export_' . date('Y-m-d_H-i-s') . '.csv"');
    }

    /**
     * Reset user password (ADMIN ONLY)
     */
    public function resetPassword(int $id, Request $request): JsonResponse
    {
        $newPassword = $request->input('password', 'password123');
        
        $result = $this->userService->resetPassword($id, $newPassword);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'RESET_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'RESET_SUCCESS',
        ], 200);
    }

    /**
     * Update user role (ADMIN ONLY)
     */
    public function updateRole(int $id, Request $request): JsonResponse
    {
        // Prevent changing own role
        if ($id === auth()->id()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat mengubah role sendiri.',
                'code' => 'SELF_ROLE_CHANGE_FORBIDDEN',
            ], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,guru,siswa',
        ]);

        $result = $this->userService->updateRole($id, $validated['role']);

        if (!$result['success']) {
            return response()->json([
                'status' => 'error',
                'message' => $result['message'],
                'code' => $result['code'] ?? 'ROLE_UPDATE_FAILED',
            ], 400);
        }

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'code' => 'ROLE_UPDATE_SUCCESS',
            'data' => $result['user'],
        ], 200);
    }
}