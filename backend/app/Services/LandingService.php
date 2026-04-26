<?php

namespace App\Services;

use App\Models\User;
use App\Models\ClassModel;
use App\Models\Project;
use App\Models\Attendance;
use Carbon\Carbon;

class LandingService
{
    /**
     * Get landing page hero content
     */
    public function getHeroContent(): array
    {
        return [
            'title' => 'RPL Smart Ecosystem',
            'subtitle' => 'Platform pembelajaran jurusan RPL yang modern, terintegrasi, dan siap untuk masa depan',
            'cta_primary' => [
                'text' => 'Career Simulator',
                'url' => '/simulator',
            ],
            'cta_secondary' => [
                'text' => 'Login',
                'url' => '/login',
            ],
        ];
    }

    /**
     * Get features list
     */
    public function getFeatures(): array
    {
        return [
            [
                'icon' => 'calendar-check',
                'title' => 'Absensi Smart',
                'description' => 'Absensi harian dengan validasi lokasi GPS dan foto selfie real-time',
            ],
            [
                'icon' => 'code',
                'title' => 'Project Tracking',
                'description' => 'Kelola dan track progress project coding dengan Git integration',
            ],
            [
                'icon' => 'trending-up',
                'title' => 'Skill Analytics',
                'description' => 'Track dan visualisasi perkembangan skill programming kamu',
            ],
        ];
    }

    /**
     * Get testimonials (dummy for now)
     */
    public function getTestimonials(): array
    {
        return [
            [
                'name' => 'Ahmad Rizki',
                'role' => 'Siswa RPL XII',
                'text' => 'Platform ini sangat membantu saya track progress belajar dan project.',
                'avatar' => null,
            ],
            [
                'name' => 'Budi Santoso',
                'role' => 'Guru RPL',
                'text' => 'Memudahkan monitoring absensi dan progress siswa secara real-time.',
                'avatar' => null,
            ],
        ];
    }

    /**
     * Get public statistics
     */
    public function getPublicStats(): array
    {
        return [
            [
                'label' => 'Siswa Aktif',
                'value' => User::where('role', 'siswa')->where('is_active', true)->count(),
                'icon' => 'users',
            ],
            [
                'label' => 'Guru',
                'value' => User::where('role', 'guru')->where('is_active', true)->count(),
                'icon' => 'chalkboard-teacher',
            ],
            [
                'label' => 'Project',
                'value' => Project::where('visibility', true)->count(),
                'icon' => 'folder',
            ],
            [
                'label' => 'Kelas',
                'value' => ClassModel::where('is_active', true)->count(),
                'icon' => 'school',
            ],
        ];
    }

    /**
     * Get recent public projects
     */
    public function getRecentProjects(int $limit = 6): array
    {
        return Project::where('visibility', true)
            ->where('status', 'completed')
            ->with('user:id,name,avatar_url')
            ->latest()
            ->limit($limit)
            ->get(['id', 'title', 'slug', 'description', 'repository_url', 'demo_url', 'tags', 'created_at'])
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'title' => $project->title,
                    'slug' => $project->slug,
                    'description' => \Illuminate\Support\Str::limit($project->description, 100),
                    'repository_url' => $project->repository_url,
                    'demo_url' => $project->demo_url,
                    'tags' => $project->tags,
                    'author' => [
                        'name' => $project->user->name,
                        'avatar_url' => $project->user->avatar_url,
                    ],
                    'created_at' => $project->created_at->diffForHumans(),
                ];
            })
            ->toArray();
    }
}