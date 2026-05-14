<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PklLocation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PklLocationController extends Controller
{
    /**
     * Display a listing of PKL locations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = PklLocation::query();

        // Filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('company_name', 'like', "%{$request->search}%")
                  ->orWhere('address', 'like', "%{$request->search}%")
                  ->orWhere('supervisor_name', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('is_approved')) {
            $query->where('is_approved', filter_var($request->is_approved, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $locations = $query->with('approver:id,name')
            ->orderBy('is_approved', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'status' => 'success',
            'message' => 'Data lokasi PKL berhasil diambil.',
            'code' => 'PKL_LOCATIONS_SUCCESS',
            'data' => $locations,
            'meta' => [
                'current_page' => $locations->currentPage(),
                'per_page' => $locations->perPage(),
                'total' => $locations->total(),
                'last_page' => $locations->lastPage(),
            ],
        ], 200);
    }

    /**
     * Get only approved PKL locations.
     */
    public function getApproved(): JsonResponse
    {
        $locations = PklLocation::approved()
            ->select('id', 'company_name', 'address', 'latitude', 'longitude', 'radius_meters', 'supervisor_name')
            ->orderBy('company_name')
            ->get();

        return response()->json([
            'status' => 'success',
            'message' => 'Lokasi PKL yang disetujui berhasil diambil.',
            'code' => 'APPROVED_PKL_LOCATIONS_SUCCESS',
            'data' => $locations,
        ], 200);
    }

    /**
     * Store a newly created PKL location.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'address' => 'required|string|max:1000',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'radius_meters' => 'required|integer|min:10|max:1000',
            'supervisor_name' => 'nullable|string|max:255',
            'supervisor_phone' => 'nullable|string|max:20',
            'supervisor_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:2000',
            'is_approved' => 'boolean',
            'is_active' => 'boolean',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:users,id',
        ], [
            'latitude.between' => 'Latitude harus antara -90 sampai 90.',
            'longitude.between' => 'Longitude harus antara -180 sampai 180.',
            'radius_meters.min' => 'Radius minimal 10 meter.',
            'radius_meters.max' => 'Radius maksimal 1000 meter.',
        ]);

        try {
            DB::beginTransaction();

            $location = PklLocation::create([
                'company_name' => $validated['company_name'],
                'address' => $validated['address'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'radius_meters' => $validated['radius_meters'],
                'supervisor_name' => $validated['supervisor_name'] ?? null,
                'supervisor_phone' => $validated['supervisor_phone'] ?? null,
                'supervisor_email' => $validated['supervisor_email'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_approved' => $validated['is_approved'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'approved_by' => ($validated['is_approved'] ?? false) ? auth()->id() : null,
                'approved_at' => ($validated['is_approved'] ?? false) ? now() : null,
            ]);

            // Assign students if provided
            if (!empty($validated['student_ids'])) {
                User::whereIn('id', $validated['student_ids'])
                    ->update(['pkl_location_id' => $location->id]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Lokasi PKL berhasil ditambahkan ' . (!empty($validated['student_ids']) ? 'dan siswa telah ditugaskan.' : '.'),
                'code' => 'PKL_LOCATION_CREATED',
                'data' => $location->load('approver:id,name'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PklLocationController::store failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan lokasi PKL.',
                'code' => 'SERVER_ERROR',
                'debug' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display the specified PKL location.
     */
    public function show(int $id): JsonResponse
    {
        $location = PklLocation::with('approver:id,name')->find($id);

        if (!$location) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lokasi PKL tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Detail lokasi PKL berhasil diambil.',
            'code' => 'PKL_LOCATION_SUCCESS',
            'data' => $location,
        ], 200);
    }

    /**
     * Update the specified PKL location.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $location = PklLocation::find($id);

        if (!$location) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lokasi PKL tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:1000',
            'latitude' => 'sometimes|required|numeric|between:-90,90',
            'longitude' => 'sometimes|required|numeric|between:-180,180',
            'radius_meters' => 'sometimes|required|integer|min:10|max:1000',
            'supervisor_name' => 'nullable|string|max:255',
            'supervisor_phone' => 'nullable|string|max:20',
            'supervisor_email' => 'nullable|email|max:255',
            'notes' => 'nullable|string|max:2000',
            'is_approved' => 'boolean',
            'is_active' => 'boolean',
        ]);

        try {
            // If approving, set approver info
            if (isset($validated['is_approved']) && $validated['is_approved'] && !$location->is_approved) {
                $validated['approved_by'] = auth()->id();
                $validated['approved_at'] = now();
            }

            $location->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Lokasi PKL berhasil diupdate.',
                'code' => 'PKL_LOCATION_UPDATED',
                'data' => $location->fresh()->load('approver:id,name'),
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::update failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal update lokasi PKL.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Approve a PKL location.
     */
    public function approve(int $id): JsonResponse
    {
        $location = PklLocation::find($id);

        if (!$location) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lokasi PKL tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        if ($location->is_approved) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lokasi PKL sudah disetujui sebelumnya.',
                'code' => 'ALREADY_APPROVED',
            ], 400);
        }

        try {
            $location->update([
                'is_approved' => true,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Lokasi PKL berhasil disetujui. Siswa kelas 12 dapat absen di sini.',
                'code' => 'PKL_LOCATION_APPROVED',
                'data' => $location->fresh(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::approve failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menyetujui lokasi PKL.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Remove the specified PKL location.
     */
    public function destroy(int $id): JsonResponse
    {
        $location = PklLocation::find($id);

        if (!$location) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lokasi PKL tidak ditemukan.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Check if location has attendances (soft delete instead)
        $hasAttendances = \App\Models\Attendance::where('pkl_location_id', $id)->exists();
        
        if ($hasAttendances) {
            // Soft delete instead of hard delete
            $location->update(['is_active' => false]);
            
            return response()->json([
                'status' => 'success',
                'message' => 'Lokasi PKL dinonaktifkan (karena memiliki data absensi).',
                'code' => 'PKL_LOCATION_DEACTIVATED',
            ], 200);
        }

        try {
            $location->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Lokasi PKL berhasil dihapus.',
                'code' => 'PKL_LOCATION_DELETED',
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::destroy failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus lokasi PKL.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Get students eligible for PKL (Class XII and RPL major).
     */
    public function getStudents(Request $request): JsonResponse
    {
        $query = User::role('siswa')
            ->whereHas('classes', function($q) {
                // Filter by the actual class level assigned to the student
                $q->where('classes.level', 'XII')
                  ->where('class_user.is_active', true);
            })
            ->whereHas('profile', function($q) {
                // Strictly RPL major only (stored in profile)
                $q->where('major', 'RPL');
            })
            ->with(['profile', 'pklLocation:id,company_name', 'classes' => function($q) {
                $q->where('classes.is_active', true)->where('classes.level', 'XII');
            }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('pklLocation', function($sq) use ($search) {
                      $sq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('pkl_location_id')) {
            $query->where('pkl_location_id', $request->pkl_location_id);
        }

        $students = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'status' => 'success',
            'message' => 'Data siswa PKL (RPL XII) berhasil diambil.',
            'code' => 'PKL_STUDENTS_SUCCESS',
            'data' => $students,
        ], 200);
    }

    /**
     * Assign students to a PKL location.
     */
    public function assignStudents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:users,id',
            'pkl_location_id' => 'required|exists:pkl_locations,id',
        ]);

        try {
            User::whereIn('id', $validated['student_ids'])
                ->update(['pkl_location_id' => $validated['pkl_location_id']]);

            return response()->json([
                'status' => 'success',
                'message' => 'Siswa berhasil ditugaskan ke lokasi PKL.',
                'code' => 'PKL_ASSIGNMENT_SUCCESS',
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::assignStudents failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menugaskan siswa.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }
}