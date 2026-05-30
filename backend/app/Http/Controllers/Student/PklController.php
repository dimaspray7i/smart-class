<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\PklLocation;
use Illuminate\Support\Facades\DB;

class PklController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $pklLocation = null;
        if ($user->pkl_location_id) {
            $pklLocation = PklLocation::find($user->pkl_location_id);
        }

        try {
            $journals = DB::table('pkl_journals')
                ->where('user_id', $user->id)
                ->orderByDesc('date')
                ->get()
                ->map(function ($j) {
                    $j->file_url = $j->file_path ? asset('storage/' . $j->file_path) : null;
                    return $j;
                });
        } catch (\Exception $e) {
            $journals = collect([]);
        }

        // PKL attendance stats
        $pklAttendance = [];
        try {
            $pklAttendance = DB::table('attendances')
                ->where('user_id', $user->id)
                ->whereNotNull('pkl_location_id')
                ->select('date', 'status', 'check_in_time', 'check_out_time')
                ->orderByDesc('date')
                ->limit(30)
                ->get();
        } catch (\Exception $e) {
            $pklAttendance = collect([]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Data PKL berhasil diambil.',
            'data'    => [
                'pkl_location'   => $pklLocation,
                'status'         => $pklLocation ? 'active' : 'not_assigned',
                'journals'       => $journals->values(),
                'pkl_attendance' => $pklAttendance,
                'is_eligible'    => $user->isPklEligible(),
                'summary'        => [
                    'total_journals'  => $journals->count(),
                    'total_days'      => $pklAttendance instanceof \Illuminate\Support\Collection ? $pklAttendance->count() : count($pklAttendance),
                    'start_date'      => $pklLocation?->start_date ?? null,
                    'end_date'        => $pklLocation?->end_date ?? null,
                ],
            ],
        ], 200);
    }

    public function uploadJournal(Request $request): JsonResponse
    {
        $request->validate([
            'date'     => 'required|date',
            'activity' => 'required|string|max:2000',
            'file'     => 'nullable|file|max:5120|mimes:pdf,jpg,jpeg,png',
        ]);

        $user     = $request->user();
        $filePath = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('pkl_journals/' . $user->id, 'public');
        }

        try {
            DB::table('pkl_journals')->insert([
                'user_id'    => $user->id,
                'date'       => $request->date,
                'activity'   => $request->activity,
                'file_path'  => $filePath,
                'status'     => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Jurnal PKL berhasil dikirim.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengirim jurnal: ' . $e->getMessage(),
            ], 500);
        }
    }
}
