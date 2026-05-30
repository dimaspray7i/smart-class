<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $tasks = DB::table('tasks')
                ->leftJoin('subjects', 'tasks.subject_id', '=', 'subjects.id')
                ->leftJoin('users as teachers', 'tasks.created_by', '=', 'teachers.id')
                ->leftJoin('task_submissions', function ($join) use ($user) {
                    $join->on('task_submissions.task_id', '=', 'tasks.id')
                         ->where('task_submissions.user_id', $user->id);
                })
                ->select(
                    'tasks.id',
                    'tasks.title',
                    'tasks.description',
                    'tasks.deadline',
                    'tasks.file_path',
                    'tasks.created_at',
                    'subjects.name as subject_name',
                    'teachers.name as teacher_name',
                    'task_submissions.id as submission_id',
                    'task_submissions.file_path as submission_file',
                    'task_submissions.submitted_at',
                    'task_submissions.grade as submission_grade'
                )
                ->orderBy('tasks.deadline')
                ->get()
                ->map(function ($t) {
                    $t->is_submitted     = !is_null($t->submission_id);
                    $t->is_late          = !is_null($t->deadline)
                        && now() > \Carbon\Carbon::parse($t->deadline)
                        && !$t->is_submitted;
                    $t->deadline_formatted = $t->deadline
                        ? \Carbon\Carbon::parse($t->deadline)->format('d M Y H:i')
                        : null;
                    $t->file_url = $t->file_path ? asset('storage/' . $t->file_path) : null;
                    $t->submission_file_url = $t->submission_file ? asset('storage/' . $t->submission_file) : null;
                    return $t;
                });

            $pending   = $tasks->filter(fn ($t) => !$t->is_submitted)->count();
            $submitted = $tasks->filter(fn ($t) => $t->is_submitted)->count();
            $late      = $tasks->filter(fn ($t) => $t->is_late)->count();

            return response()->json([
                'status'  => 'success',
                'message' => 'Data tugas berhasil diambil.',
                'data'    => [
                    'tasks'   => $tasks->values(),
                    'summary' => [
                        'total'     => $tasks->count(),
                        'pending'   => $pending,
                        'submitted' => $submitted,
                        'late'      => $late,
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'success',
                'message' => 'Data tugas berhasil diambil.',
                'data'    => [
                    'tasks'   => [],
                    'summary' => ['total' => 0, 'pending' => 0, 'submitted' => 0, 'late' => 0],
                ],
            ], 200);
        }
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'task_id' => 'required|integer',
            'file'    => 'required|file|max:10240|mimes:pdf,doc,docx,zip,rar,jpg,jpeg,png',
        ]);

        $user = $request->user();

        try {
            $path = $request->file('file')->store('task_submissions/' . $user->id, 'public');

            DB::table('task_submissions')->updateOrInsert(
                ['task_id' => $request->task_id, 'user_id' => $user->id],
                [
                    'file_path'    => $path,
                    'submitted_at' => now(),
                    'updated_at'   => now(),
                    'created_at'   => now(),
                ]
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Tugas berhasil dikirim.',
                'data'    => ['file_url' => asset('storage/' . $path)],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengirim tugas: ' . $e->getMessage(),
            ], 500);
        }
    }
}
