<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $grades = DB::table('grades')
                ->join('subjects', 'grades.subject_id', '=', 'subjects.id')
                ->leftJoin('users as teachers', 'subjects.teacher_id', '=', 'teachers.id')
                ->where('grades.user_id', $user->id)
                ->select(
                    'grades.id',
                    'grades.task_grade',
                    'grades.uts_grade',
                    'grades.uas_grade',
                    'grades.final_grade',
                    'grades.semester',
                    'grades.notes',
                    'subjects.id as subject_id',
                    'subjects.name as subject_name',
                    'subjects.code as subject_code',
                    'teachers.name as teacher_name'
                )
                ->orderBy('subjects.name')
                ->get();

            $avgGrade = $grades->avg('final_grade') ?? 0;
            $highest  = $grades->max('final_grade') ?? 0;
            $lowest   = $grades->min('final_grade') ?? 0;

            // Ranking: count students with higher average
            $rank = null;
            try {
                $studentClass = $user->classes()
                    ->wherePivot('is_active', true)
                    ->wherePivot('role_in_class', 'siswa')
                    ->first();

                if ($studentClass) {
                    $classmates = DB::table('class_user')
                        ->where('class_id', $studentClass->id)
                        ->where('role_in_class', 'siswa')
                        ->pluck('user_id');

                    $averages = DB::table('grades')
                        ->whereIn('user_id', $classmates)
                        ->groupBy('user_id')
                        ->selectRaw('user_id, AVG(final_grade) as avg_grade')
                        ->orderByDesc('avg_grade')
                        ->get();

                    $rank = $averages->search(fn($r) => $r->user_id == $user->id);
                    $rank = $rank !== false ? $rank + 1 : null;
                    $rank = $rank ? ['position' => $rank, 'total' => $classmates->count()] : null;
                }
            } catch (\Exception $e) {
                $rank = null;
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Data nilai berhasil diambil.',
                'data'    => [
                    'grades'  => $grades->values(),
                    'summary' => [
                        'average'        => round($avgGrade, 2),
                        'highest'        => $highest,
                        'lowest'         => $lowest,
                        'total_subjects' => $grades->count(),
                        'ranking'        => $rank,
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'success',
                'message' => 'Data nilai berhasil diambil.',
                'data'    => [
                    'grades'  => [],
                    'summary' => [
                        'average'        => 0,
                        'highest'        => 0,
                        'lowest'         => 0,
                        'total_subjects' => 0,
                        'ranking'        => null,
                    ],
                ],
            ], 200);
        }
    }
}
