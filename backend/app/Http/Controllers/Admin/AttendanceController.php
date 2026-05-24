<?php
/**
 * 🛡️ ADMIN ATTENDANCE CONTROLLER
 * Comprehensive management of student attendance records
 */

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AttendanceController extends Controller
{
    /**
     * Display a listing of attendance records
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Attendance::with(['user.profile', 'pklLocation']);

            // Filter by date
            if ($request->has('date')) {
                $query->whereDate('date', $request->date);
            } else {
                $query->whereDate('date', today());
            }

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Search by student name or NIS
            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhereHas('profile', fn($pq) => $pq->where('nis', 'like', "%{$search}%"));
                });
            }

            $attendance = $query->orderByDesc('created_at')->get();

            return response()->json([
                'status' => 'success',
                'message' => 'Attendance records retrieved successfully.',
                'data' => $attendance,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Admin Attendance Index Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data absensi.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update attendance status manually
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:Hadir,Terlambat,Alpha,Izin,Sakit',
                'notes' => 'nullable|string'
            ]);

            $attendance = Attendance::findOrFail($id);
            $attendance->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Status absensi berhasil diperbarui.',
                'data' => $attendance,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui status absensi.',
            ], 500);
        }
    }
}
