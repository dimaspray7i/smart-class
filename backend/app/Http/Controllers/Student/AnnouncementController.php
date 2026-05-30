<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Announcement;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $studentClass = $user->getCurrentClass();

        $query = Announcement::with(['teacher:id,name,avatar_url'])
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at');

        if ($studentClass) {
            $query->where(function($q) use ($studentClass) {
                $q->whereNull('target_class')
                  ->orWhere('target_class', $studentClass->name)
                  ->orWhere('target_class', 'all')
                  ->orWhere('target_class', $studentClass->id);
            });
        } else {
            $query->where(function($q) {
                $q->whereNull('target_class')
                  ->orWhere('target_class', 'all');
            });
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        $announcements = $query->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengumuman berhasil diambil.',
            'data' => $announcements->items(),
            'meta' => [
                'current_page' => $announcements->currentPage(),
                'last_page' => $announcements->lastPage(),
                'total' => $announcements->total(),
                'per_page' => $announcements->perPage(),
            ]
        ], 200);
    }
}
