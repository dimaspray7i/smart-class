<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PklLocation;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
class PklLocationController extends Controller
{
    /**
     * Cache configuration for PKL locations
     */
    private const CACHE_KEY = 'approved_pkl_locations';
    private const CACHE_TTL = 1800; // 30 minutes

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
                  ->orWhere('supervisor_name', 'like', "%{$request->search}%")
                  ->orWhere('supervisor_email', 'like', "%{$request->search}%");
            });
        }

        if ($request->filled('is_approved')) {
            $query->where('is_approved', filter_var($request->is_approved, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('city')) {
            $query->where('city', 'like', "%{$request->city}%");
        }

        // Geo-filter: locations within radius of school
        if ($request->filled('latitude') && $request->filled('longitude') && $request->filled('radius_km')) {
            $lat = $request->latitude;
            $lng = $request->longitude;
            $radius = $request->radius_km * 1000; // Convert to meters
            
            // Haversine formula for distance calculation
            $query->selectRaw("*, 
                (6371 * acos(
                    cos(radians(?)) * cos(radians(latitude)) * 
                    cos(radians(longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(latitude))
                )) as distance", [$lat, $lng, $lat])
                ->having('distance', '<=', $request->radius_km);
        }

        $locations = $query->with(['approver:id,name', 'students' => fn($q) => $q->select('users.id', 'users.name', 'users.email')])
            ->orderBy('is_approved', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'status' => 'success',
            'message' => 'PKL locations retrieved successfully.',
            'code' => 'PKL_LOCATIONS_SUCCESS',
            'data' => $locations,
            'meta' => [
                'current_page' => $locations->currentPage(),
                'per_page' => $locations->perPage(),
                'total' => $locations->total(),
                'last_page' => $locations->lastPage(),
                'filters_applied' => array_filter($request->only(['search', 'is_approved', 'is_active', 'city'])),
            ],
        ], 200);
    }

    /**
     * Get only approved PKL locations (cached).
     */
    public function getApproved(): JsonResponse
    {
        $locations = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return PklLocation::approved()
                ->select('id', 'company_name', 'address', 'latitude', 'longitude', 'radius_meters', 'supervisor_name', 'city')
                ->orderBy('company_name')
                ->get();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Approved PKL locations retrieved successfully.',
            'code' => 'APPROVED_PKL_LOCATIONS_SUCCESS',
            'data' => $locations,
            'meta' => [
                'cached' => true,
                'cache_ttl' => self::CACHE_TTL,
                'count' => $locations->count(),
            ],
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
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
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
            // Geo-fencing validation: ensure location is within reasonable distance from school
            'school_reference_lat' => 'nullable|numeric|between:-90,90',
            'school_reference_lng' => 'nullable|numeric|between:-180,180',
            'max_distance_from_school_km' => 'nullable|integer|min:1|max:100',
        ], [
            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
            'radius_meters.min' => 'Radius must be at least 10 meters.',
            'radius_meters.max' => 'Radius cannot exceed 1000 meters.',
        ]);

        // Geo-fencing validation if reference provided
        if (!empty($validated['school_reference_lat']) && !empty($validated['school_reference_lng']) && !empty($validated['max_distance_from_school_km'])) {
            $distance = $this->calculateDistance(
                $validated['school_reference_lat'],
                $validated['school_reference_lng'],
                $validated['latitude'],
                $validated['longitude']
            );
            
            if ($distance > $validated['max_distance_from_school_km']) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Location is too far from school reference point. Distance: {$distance}km, Max allowed: {$validated['max_distance_from_school_km']}km.",
                    'code' => 'GEO_FENCING_VIOLATION',
                    'data' => [
                        'calculated_distance_km' => round($distance, 2),
                        'max_allowed_km' => $validated['max_distance_from_school_km'],
                    ],
                ], 422);
            }
        }

        try {
            DB::beginTransaction();

            $location = PklLocation::create([
                'company_name' => $validated['company_name'],
                'address' => $validated['address'],
                'city' => $validated['city'] ?? null,
                'province' => $validated['province'] ?? null,
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
                    ->where('role', 'siswa')
                    ->update(['pkl_location_id' => $location->id]);
                
                // Log student assignments
                Log::info('Students assigned to PKL location', [
                    'location_id' => $location->id,
                    'student_ids' => $validated['student_ids'],
                    'assigned_by' => auth()->id(),
                ]);
            }

            DB::commit();

            // Clear approved locations cache
            Cache::forget(self::CACHE_KEY);

            return response()->json([
                'status' => 'success',
                'message' => 'PKL location created successfully' . (!empty($validated['student_ids']) ? ' and students assigned.' : '.'),
                'code' => 'PKL_LOCATION_CREATED',
                'data' => $location->load(['approver:id,name', 'students:id,name,email']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PklLocationController::store failed', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id(),
                'input' => $request->only(['company_name', 'address', 'latitude', 'longitude']),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create PKL location.',
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
        $location = PklLocation::with([
            'approver:id,name',
            'students' => fn($q) => $q->select('users.id', 'users.name', 'users.email', 'users.avatar_url'),
            'attendances' => fn($q) => $q->select('id', 'user_id', 'date', 'status')->latest()->limit(10),
        ])->find($id);

        if (!$location) {
            return response()->json([
                'status' => 'error',
                'message' => 'PKL location not found.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'PKL location details retrieved successfully.',
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
                'message' => 'PKL location not found.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        $validated = $request->validate([
            'company_name' => 'sometimes|required|string|max:255',
            'address' => 'sometimes|required|string|max:1000',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
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

            // Clear approved locations cache if approval status changed
            if (isset($validated['is_approved'])) {
                Cache::forget(self::CACHE_KEY);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'PKL location updated successfully.',
                'code' => 'PKL_LOCATION_UPDATED',
                'data' => $location->fresh()->load(['approver:id,name']),
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::update failed', [
                'id' => $id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update PKL location.',
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
                'message' => 'PKL location not found.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        if ($location->is_approved) {
            return response()->json([
                'status' => 'error',
                'message' => 'PKL location already approved.',
                'code' => 'ALREADY_APPROVED',
            ], 400);
        }

        try {
            $location->update([
                'is_approved' => true,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Clear approved locations cache
            Cache::forget(self::CACHE_KEY);

            Log::info('PKL location approved', [
                'location_id' => $id,
                'approved_by' => auth()->id(),
                'company_name' => $location->company_name,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'PKL location approved successfully. Grade 12 students can now check in here.',
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
                'message' => 'Failed to approve PKL location.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Bulk approve multiple PKL locations.
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:pkl_locations,id',
        ]);

        try {
            DB::beginTransaction();

            $approved = 0;
            foreach ($validated['location_ids'] as $id) {
                $location = PklLocation::find($id);
                if ($location && !$location->is_approved) {
                    $location->update([
                        'is_approved' => true,
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ]);
                    $approved++;
                }
            }

            DB::commit();
            Cache::forget(self::CACHE_KEY);

            return response()->json([
                'status' => 'success',
                'message' => "{$approved} PKL locations approved successfully.",
                'code' => 'BULK_APPROVE_SUCCESS',
                'data' => ['approved_count' => $approved],
            ], 200);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            Log::error('PklLocationController::bulkApprove failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to bulk approve locations.',
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
                'message' => 'PKL location not found.',
                'code' => 'NOT_FOUND',
            ], 404);
        }

        // Check if location has attendances (soft delete instead)
        $hasAttendances = \App\Models\Attendance::where('pkl_location_id', $id)->exists();
        
        if ($hasAttendances) {
            // Soft delete instead of hard delete
            $location->update(['is_active' => false]);
            
            Log::info('PKL location deactivated (has attendances)', [
                'location_id' => $id,
                'deactivated_by' => auth()->id(),
            ]);
            
            return response()->json([
                'status' => 'success',
                'message' => 'PKL location deactivated (has attendance records).',
                'code' => 'PKL_LOCATION_DEACTIVATED',
            ], 200);
        }

        try {
            $location->delete();
            Cache::forget(self::CACHE_KEY);

            Log::info('PKL location deleted', [
                'location_id' => $id,
                'deleted_by' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'PKL location deleted successfully.',
                'code' => 'PKL_LOCATION_DELETED',
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::destroy failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete PKL location.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Bulk delete multiple PKL locations.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:pkl_locations,id',
        ]);

        try {
            DB::beginTransaction();

            $deleted = 0;
            $deactivated = 0;
            $errors = [];

            foreach ($validated['location_ids'] as $id) {
                $location = PklLocation::find($id);
                if (!$location) continue;

                $hasAttendances = \App\Models\Attendance::where('pkl_location_id', $id)->exists();
                
                if ($hasAttendances) {
                    $location->update(['is_active' => false]);
                    $deactivated++;
                } else {
                    $location->delete();
                    $deleted++;
                }
            }

            DB::commit();
            Cache::forget(self::CACHE_KEY);

            return response()->json([
                'status' => 'success',
                'message' => "Bulk operation completed: {$deleted} deleted, {$deactivated} deactivated.",
                'code' => 'BULK_DELETE_SUCCESS',
                'data' => [
                    'deleted_count' => $deleted,
                    'deactivated_count' => $deactivated,
                ],
            ], 200);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) DB::rollBack();
            Log::error('PklLocationController::bulkDelete failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to bulk delete locations.',
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
            ->whereHas('profile', function($q) {
                // Filter by RPL major and Grade XII
                $q->where('major', 'RPL')
                  ->where('class_level', 'XII');
            })
            ->with([
                'profile' => fn($q) => $q->select('user_id', 'nis', 'major', 'class_level'),
                'pklLocation' => fn($q) => $q->select('id', 'company_name'),
                'classes' => function($q) {
                    $q->where('classes.is_active', true)
                      ->where('classes.level', 'XII')
                      ->select('classes.id', 'classes.name', 'classes.level');
                }
            ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', fn($pq) => $pq->where('nis', 'like', "%{$search}%"))
                  ->orWhereHas('pklLocation', function($sq) use ($search) {
                      $sq->where('company_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('pkl_location_id')) {
            $query->where('pkl_location_id', $request->pkl_location_id);
        }

        if ($request->filled('has_placement')) {
            if ($request->boolean('has_placement')) {
                $query->whereNotNull('pkl_location_id');
            } else {
                $query->whereNull('pkl_location_id');
            }
        }

        $students = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'status' => 'success',
            'message' => 'PKL eligible students (RPL Grade XII) retrieved successfully.',
            'code' => 'PKL_STUDENTS_SUCCESS',
            'data' => $students,
            'meta' => [
                'filters_applied' => array_filter($request->only(['search', 'pkl_location_id', 'has_placement'])),
            ],
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
            // Verify location is approved
            $location = PklLocation::find($validated['pkl_location_id']);
            if (!$location->is_approved) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot assign students to unapproved PKL location.',
                    'code' => 'LOCATION_NOT_APPROVED',
                ], 400);
            }

            $updated = User::whereIn('id', $validated['student_ids'])
                ->where('role', 'siswa')
                ->update(['pkl_location_id' => $validated['pkl_location_id']]);

            Log::info('Students assigned to PKL location', [
                'location_id' => $validated['pkl_location_id'],
                'student_count' => $updated,
                'assigned_by' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "{$updated} student(s) assigned to PKL location successfully.",
                'code' => 'PKL_ASSIGNMENT_SUCCESS',
                'data' => [
                    'assigned_count' => $updated,
                    'location_id' => $validated['pkl_location_id'],
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::assignStudents failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to assign students.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Unassign students from PKL location.
     */
    public function unassignStudents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:users,id',
        ]);

        try {
            $updated = User::whereIn('id', $validated['student_ids'])
                ->where('role', 'siswa')
                ->update(['pkl_location_id' => null]);

            Log::info('Students unassigned from PKL', [
                'student_count' => $updated,
                'unassigned_by' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "{$updated} student(s) unassigned from PKL successfully.",
                'code' => 'PKL_UNASSIGN_SUCCESS',
                'data' => ['unassigned_count' => $updated],
            ], 200);

        } catch (\Exception $e) {
            Log::error('PklLocationController::unassignStudents failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to unassign students.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Unassign a single student from PKL location.
     */
    public function unassignStudent(int $studentId): JsonResponse
    {
        try {
            $user = User::where('id', $studentId)->where('role', 'siswa')->first();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Student not found.',
                    'code' => 'NOT_FOUND',
                ], 404);
            }

            $user->update(['pkl_location_id' => null]);

            Log::info('Student unassigned from PKL', [
                'student_id' => $studentId,
                'unassigned_by' => auth()->id(),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Student unassigned from PKL successfully.',
                'code' => 'PKL_UNASSIGN_SUCCESS',
            ], 200);
        } catch (\Exception $e) {
            Log::error('PklLocationController::unassignStudent failed', [
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to unassign student.',
                'code' => 'SERVER_ERROR',
            ], 500);
        }
    }

    /**
     * Export PKL locations to CSV.
     */
    public function export(Request $request): \Illuminate\Http\Response
    {
        $query = PklLocation::query();

        if ($request->filled('search')) {
            $query->where('company_name', 'like', "%{$request->search}%");
        }
        if ($request->filled('is_approved')) {
            $query->where('is_approved', filter_var($request->is_approved, FILTER_VALIDATE_BOOLEAN));
        }

        $locations = $query->withCount('students')->get();

        $csvData = [];
        $csvData[] = ['ID', 'Company', 'Address', 'City', 'Latitude', 'Longitude', 'Radius(m)', 'Supervisor', 'Email', 'Phone', 'Approved', 'Students', 'Created'];

        foreach ($locations as $loc) {
            $csvData[] = [
                $loc->id,
                $loc->company_name,
                $loc->address,
                $loc->city ?? '',
                $loc->latitude,
                $loc->longitude,
                $loc->radius_meters,
                $loc->supervisor_name ?? '',
                $loc->supervisor_email ?? '',
                $loc->supervisor_phone ?? '',
                $loc->is_approved ? 'Yes' : 'No',
                $loc->students_count,
                $loc->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $csvContent = '';
        foreach ($csvData as $row) {
            $csvContent .= implode(',', array_map(function($field) {
                return '"' . str_replace('"', '""', $field) . '"';
            }, $row)) . "\n";
        }

        $filename = 'pkl-locations-' . now()->format('Y-m-d') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response($csvContent, 200, $headers);
    }

    /**
     * Calculate distance between two coordinates using Haversine formula.
     * 
     * @param float $lat1
     * @param float $lng1
     * @param float $lat2
     * @param float $lng2
     * @return float Distance in kilometers
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // Earth's radius in kilometers
        
        $lat1Rad = deg2rad($lat1);
        $lng1Rad = deg2rad($lng1);
        $lat2Rad = deg2rad($lat2);
        $lng2Rad = deg2rad($lng2);
        
        $deltaLat = $lat2Rad - $lat1Rad;
        $deltaLng = $lng2Rad - $lng1Rad;
        
        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLng / 2) * sin($deltaLng / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }
}