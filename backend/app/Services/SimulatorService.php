<?php

namespace App\Services;

use App\Models\CareerPath;
use App\Models\SimulatorStep;
use App\Models\SimulatorSession;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Exception;

class SimulatorService
{
    /**
     * Get all career paths
     */
    public function getPaths(): array
    {
        return CareerPath::where('is_active', true)
            ->withCount('steps')
            ->withCount('sessions')
            ->orderBy('title')
            ->get()
            ->map(function ($path) {
                return [
                    'id' => $path->id,
                    'title' => $path->title,
                    'slug' => $path->slug,
                    'description' => $path->description,
                    'icon' => $path->icon,
                    'color' => $path->color,
                    'steps_count' => $path->steps_count,
                    'sessions_count' => $path->sessions_count,
                    'required_skills' => $path->required_skills ?? [],
                    'career_outcomes' => $path->career_outcomes ?? [],
                ];
            })
            ->toArray();
    }

    /**
     * Get career path by slug
     */
    public function getPathBySlug(string $slug): ?array
    {
        $path = CareerPath::where('slug', $slug)
            ->where('is_active', true)
            ->with(['steps' => function ($query) {
                $query->orderBy('order');
            }])
            ->first();

        if (!$path) {
            return null;
        }

        return [
            'id' => $path->id,
            'title' => $path->title,
            'slug' => $path->slug,
            'description' => $path->description,
            'icon' => $path->icon,
            'color' => $path->color,
            'steps' => $path->steps->map(function ($step) {
                return [
                    'id' => $step->id,
                    'title' => $step->title,
                    'content' => $step->content,
                    'order' => $step->order,
                    'is_final' => $step->is_final,
                    'options' => $step->options,
                    'has_choices' => $step->has_choices,
                ];
            }),
            'required_skills' => $path->required_skills ?? [],
            'career_outcomes' => $path->career_outcomes ?? [],
        ];
    }

    /**
     * Start new simulator session
     */
    public function createSession(array $data): array
    {
        try {
            $path = CareerPath::find($data['path_id']);

            if (!$path) {
                return [
                    'success' => false,
                    'message' => 'Jalur karir tidak ditemukan.',
                    'code' => 'PATH_NOT_FOUND',
                ];
            }

            // Get first step
            $firstStep = $path->getFirstStep();

            if (!$firstStep) {
                return [
                    'success' => false,
                    'message' => 'Jalur karir belum memiliki step.',
                    'code' => 'NO_STEPS',
                ];
            }

            // Check existing active sessions for user
            if (!empty($data['user_id'])) {
                $existingSession = SimulatorSession::where('user_id', $data['user_id'])
                    ->where('career_path_id', $data['path_id'])
                    ->active()
                    ->first();

                if ($existingSession) {
                    return [
                        'success' => true,
                        'message' => 'Melanjutkan sesi yang sudah ada.',
                        'resumed' => true,
                        'session' => $existingSession,
                    ];
                }
            }

            $session = SimulatorSession::create([
                'user_id' => $data['user_id'] ?? null,
                'career_path_id' => $data['path_id'],
                'current_step_id' => $data['start_step_id'] ?? $firstStep->id,
                'choices' => [],
                'completed_at' => null,
                'result' => null,
                'session_token' => SimulatorSession::generateUniqueToken(),
                'expires_at' => now()->addHours(config('app.simulator_session_expire_hours', 24)),
            ]);

            return [
                'success' => true,
                'message' => 'Sesi simulator dimulai.',
                'resumed' => false,
                'session' => [
                    'id' => $session->id,
                    'session_token' => $session->session_token,
                    'career_path' => [
                        'id' => $path->id,
                        'title' => $path->title,
                    ],
                    'current_step' => [
                        'id' => $firstStep->id,
                        'title' => $firstStep->title,
                        'content' => $firstStep->content,
                        'options' => $firstStep->options,
                    ],
                    'progress' => 0,
                    'expires_at' => $session->expires_at->diffForHumans(),
                ],
            ];

        } catch (Exception $e) {
            Log::error('SimulatorService::createSession failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memulai sesi simulator.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Submit choice in simulator
     */
    public function processChoice(string $sessionId, array $data): array
    {
        try {
            $session = SimulatorSession::where('session_token', $sessionId)->first();

            if (!$session) {
                return [
                    'success' => false,
                    'message' => 'Sesi tidak ditemukan.',
                    'code' => 'SESSION_NOT_FOUND',
                ];
            }

            if (!$session->is_valid) {
                return [
                    'success' => false,
                    'message' => 'Sesi sudah kadaluarsa atau selesai.',
                    'code' => 'SESSION_EXPIRED',
                ];
            }

            $currentStep = $session->currentStep;

            if (!$currentStep) {
                return [
                    'success' => false,
                    'message' => 'Step saat ini tidak ditemukan.',
                    'code' => 'STEP_NOT_FOUND',
                ];
            }

            // Validate choice
            if (!$currentStep->isValidChoice($data['choice_key'])) {
                return [
                    'success' => false,
                    'message' => 'Pilihan tidak valid.',
                    'code' => 'INVALID_CHOICE',
                ];
            }

            // Add choice to history
            $session->addChoice($currentStep->title, $data['choice_key']);

            // Get next step
            $nextStep = $currentStep->getNextStep($data['choice_key']);

            if (!$nextStep) {
                return [
                    'success' => false,
                    'message' => 'Tidak ada step selanjutnya.',
                    'code' => 'NO_NEXT_STEP',
                ];
            }

            // Update current step
            $session->updateCurrentStep($nextStep->id);

            // Check if final step
            $isFinal = $nextStep->is_final;

            if ($isFinal) {
                // Generate result
                $result = $this->generateResult($session);
                $session->complete($result);

                return [
                    'success' => true,
                    'message' => 'Simulator selesai!',
                    'is_end' => true,
                    'data' => [
                        'step' => [
                            'id' => $nextStep->id,
                            'title' => $nextStep->title,
                            'content' => $nextStep->content,
                            'is_final' => true,
                        ],
                        'result' => $result,
                        'choices_history' => $session->getChoiceHistory(),
                    ],
                ];
            }

            return [
                'success' => true,
                'message' => 'Pilihan berhasil disimpan.',
                'is_end' => false,
                'data' => [
                    'step' => [
                        'id' => $nextStep->id,
                        'title' => $nextStep->title,
                        'content' => $nextStep->content,
                        'options' => $nextStep->options,
                        'is_final' => $nextStep->is_final,
                    ],
                    'choices_history' => $session->getChoiceHistory(),
                    'progress' => $session->progress,
                ],
            ];

        } catch (Exception $e) {
            Log::error('SimulatorService::processChoice failed', [
                'session_id' => $sessionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Gagal memproses pilihan.',
                'code' => 'SERVER_ERROR',
            ];
        }
    }

    /**
     * Get session result
     */
    public function getResult(string $sessionId): ?array
    {
        $session = SimulatorSession::where('session_token', $sessionId)
            ->with(['careerPath', 'currentStep'])
            ->first();

        if (!$session || !$session->is_completed) {
            return null;
        }

        return [
            'session_id' => $session->id,
            'career_path' => [
                'id' => $session->careerPath->id,
                'title' => $session->careerPath->title,
                'icon' => $session->careerPath->icon,
                'color' => $session->careerPath->color,
            ],
            'result' => $session->result,
            'choices_history' => $session->choices,
            'completed_at' => $session->completed_at->toDateTimeString(),
            'progress' => 100,
        ];
    }

    /**
     * Generate final result based on choices
     */
    private function generateResult(SimulatorSession $session): array
    {
        $choices = $session->getChoiceHistory();
        $careerPath = $session->careerPath;

        // Analyze choices to determine career recommendation
        $frontendChoices = 0;
        $backendChoices = 0;
        $fullstackChoices = 0;

        foreach ($choices as $choice) {
            $choiceKey = strtolower($choice['choice']);

            if (str_contains($choiceKey, 'frontend') || str_contains($choiceKey, 'ui') || str_contains($choiceKey, 'design')) {
                $frontendChoices++;
            } elseif (str_contains($choiceKey, 'backend') || str_contains($choiceKey, 'server') || str_contains($choiceKey, 'database')) {
                $backendChoices++;
            } else {
                $fullstackChoices++;
            }
        }

        // Determine recommendation
        $maxChoices = max($frontendChoices, $backendChoices, $fullstackChoices);

        $recommendation = 'Fullstack Developer';
        $skills = ['Laravel', 'Vue.js', 'MySQL', 'Git'];

        if ($maxChoices === $frontendChoices && $frontendChoices > 0) {
            $recommendation = 'Frontend Developer';
            $skills = ['Vue.js', 'React', 'Tailwind CSS', 'JavaScript'];
        } elseif ($maxChoices === $backendChoices && $backendChoices > 0) {
            $recommendation = 'Backend Developer';
            $skills = ['Laravel', 'PHP', 'MySQL', 'REST API'];
        }

        return [
            'career_recommendation' => $recommendation,
            'recommended_skills' => $skills,
            'timeline' => [
                'month_1' => 'Dasar Programming',
                'month_2' => 'Framework & Tools',
                'month_3' => 'Project Real',
                'month_6' => 'Magang / Freelance',
            ],
            'learning_path' => $careerPath->career_outcomes ?? [],
            'choices_summary' => [
                'frontend' => $frontendChoices,
                'backend' => $backendChoices,
                'fullstack' => $fullstackChoices,
            ],
        ];
    }
}