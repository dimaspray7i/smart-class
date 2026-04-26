<?php

namespace App\Services;

use App\Models\User;
use App\Models\Profile;

class StudentGalleryService
{
    /**
     * Get student gallery with filters
     */
    public function getGallery(?string $classLevel = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = User::where('role', 'siswa')
            ->where('is_active', true)
            ->with('profile');

        if ($classLevel) {
            $query->whereHas('profile', function ($q) use ($classLevel) {
                $q->where('class_level', $classLevel);
            });
        }

        return $query->orderBy('name')->paginate(12);
    }

    /**
     * Find student by slug
     */
    public function findBySlug(string $slug): ?array
    {
        $student = User::where('slug', $slug)
            ->where('role', 'siswa')
            ->where('is_active', true)
            ->with([
                'profile',
                'projects' => function ($query) {
                    $query->where('visibility', true)->latest()->limit(5);
                },
                'skills' => function ($query) {
                    $query->withPivot('level')->orderByPivot('level', 'desc')->limit(10);
                },
            ])
            ->first();

        if (!$student) {
            return null;
        }

        return [
            'id' => $student->id,
            'name' => $student->name,
            'email' => $student->email,
            'avatar_url' => $student->avatar_url,
            'slug' => $student->slug,
            'profile' => [
                'nis' => $student->profile?->nis,
                'class_level' => $student->profile?->class_level,
                'bio' => $student->profile?->bio,
                'github_url' => $student->profile?->github_url,
                'linkedin_url' => $student->profile?->linkedin_url,
            ],
            'projects' => $student->projects->map(function ($project) {
                return [
                    'id' => $project->id,
                    'title' => $project->title,
                    'slug' => $project->slug,
                    'description' => $project->description,
                    'status' => $project->status,
                    'repository_url' => $project->repository_url,
                    'demo_url' => $project->demo_url,
                ];
            }),
            'skills' => $student->skills->map(function ($skill) {
                return [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'category' => $skill->category,
                    'level' => $skill->pivot->level,
                ];
            }),
            'stats' => [
                'total_projects' => $student->projects()->count(),
                'total_skills' => $student->skills()->count(),
                'mastered_skills' => $student->skills()->wherePivot('level', '>=', 80)->count(),
            ],
        ];
    }

    /**
     * Get gallery statistics
     */
    public function getStats(): array
    {
        $totalStudents = User::where('role', 'siswa')->where('is_active', true)->count();

        return [
            'total' => $totalStudents,
            'by_level' => [
                'X' => Profile::where('class_level', 'X')->count(),
                'XI' => Profile::where('class_level', 'XI')->count(),
                'XII' => Profile::where('class_level', 'XII')->count(),
            ],
        ];
    }
}