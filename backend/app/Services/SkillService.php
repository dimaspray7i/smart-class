<?php

namespace App\Services;

use App\Models\Skill;
use App\Models\User;
use App\Models\StudentSkill;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class SkillService
{
    /**
     * Get all skills for user
     */
    public function getAll(int $userId): array
    {
        $skills = Skill::where('is_active', true)
            ->withCount('students')
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        // Get user's progress for each skill
        $userSkills = StudentSkill::where('user_id', $userId)
            ->get()
            ->keyBy('skill_id');

        return $skills->map(function ($skill) use ($userSkills) {
            $userSkill = $userSkills->get($skill->id);

            return [
                'id' => $skill->id,
                'name' => $skill->name,
                'slug' => $skill->slug,
                'category' => $skill->category,
                'category_label' => $skill->category_label,
                'description' => $skill->description,
                'icon' => $skill->icon,
                'max_level' => $skill->max_level,
                'user_level' => $userSkill?->level ?? 0,
                'user_hours' => $userSkill?->hours_practiced ?? 0,
                'students_count' => $skill->students_count,
                'is_popular' => $skill->is_popular,
            ];
        })->toArray();
    }

    /**
     * Get user's skill progress
     */
    public function getProgress(int $userId): array
    {
        $userSkills = StudentSkill::where('user_id', $userId)
            ->with('skill')
            ->orderBy('level', 'desc')
            ->get();

        $total = $userSkills->count();
        $mastered = $userSkills->where('level', '>=', 80)->count();
        $learning = $userSkills->where('level', '<', 80)->count();
        $averageLevel = $userSkills->avg('level') ?? 0;

        return [
            'summary' => [
                'total_skills' => $total,
                'mastered' => $mastered,
                'learning' => $learning,
                'average_level' => round($averageLevel, 2),
            ],
            'skills' => $userSkills->map(function ($userSkill) {
                return [
                    'skill_id' => $userSkill->skill_id,
                    'skill_name' => $userSkill->skill->name,
                    'category' => $userSkill->skill->category,
                    'level' => $userSkill->level,
                    'level_label' => $userSkill->level_label,
                    'level_color' => $userSkill->level_color,
                    'hours_practiced' => $userSkill->hours_practiced,
                    'last_practiced' => $userSkill->last_practiced_at?->diffForHumans(),
                    'evidence_count' => is_array($userSkill->evidence) ? count($userSkill->evidence) : 0,
                ];
            }),
        ];
    }

    /**
     * Log activity for skill
     */
    public function logActivity(int $userId, int $skillId, array $data): array
    {
        try {
            $skill = Skill::find($skillId);

            if (!$skill) {
                return [
                    'success' => false,
                    'message' => 'Skill tidak ditemukan.',
                    'code' => 'NOT_FOUND',
                ];
            }

            $studentSkill = StudentSkill::firstOrCreate(
                ['user_id' => $userId, 'skill_id' => $skillId],
                ['level' => 0, 'hours_practiced' => 0]
            );

            // Add hours and calculate level increase
            $hours = $data['hours'] ?? 1;
            $levelIncrease = $hours * 5; // 5% per hour
            $newLevel = min($studentSkill->level + $levelIncrease, 100);

            $studentSkill->update([
                'hours_practiced' => $studentSkill->hours_practiced + $hours,
                'level' => $newLevel,
                'last_practiced_at' => now(),
            ]);

            // Add evidence if provided
            if (!empty($data['evidence'])) {
                $studentSkill->addEvidence($data['evidence']);
            }

            return [
                'success' => true,
                'message' => 'Aktivitas skill berhasil dicatat.',
                'data' => [
                    'skill' => $skill->name,
                    'previous_level' => $studentSkill->getOriginal('level'),
                    'new_level' => $newLevel,
                    'total_hours' => $studentSkill->hours_practiced,
                    'level_label' => $studentSkill->level_label,
                ],
            ];

        } catch (Exception $e) {
            Log::error('SkillService::logActivity failed', [
                'user_id' => $userId,
                'skill_id' => $skillId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal mencatat aktivitas skill.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Create new skill (admin only)
     */
    public function create(array $data): array
    {
        try {
            if (Skill::where('slug', Str::slug($data['name']))->exists()) {
                return [
                    'success' => false,
                    'message' => 'Skill dengan nama ini sudah ada.',
                    'code' => 'SKILL_EXISTS',
                ];
            }

            $skill = Skill::create([
                'name' => $data['name'],
                'slug' => Str::slug($data['name']),
                'category' => $data['category'],
                'description' => $data['description'] ?? null,
                'icon' => $data['icon'] ?? null,
                'max_level' => $data['max_level'] ?? 100,
                'is_active' => $data['is_active'] ?? true,
            ]);

            return [
                'success' => true,
                'message' => 'Skill berhasil dibuat.',
                'skill' => $skill,
            ];

        } catch (Exception $e) {
            Log::error('SkillService::create failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'message' => 'Gagal membuat skill.', 'code' => 'SERVER_ERROR'];
        }
    }

    /**
     * Get skills by category
     */
    public function getByCategory(string $category): array
    {
        return Skill::where('category', $category)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->toArray();
    }
}