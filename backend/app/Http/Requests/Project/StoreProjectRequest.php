<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA SISWA yang bisa create project
        return $this->user() && $this->user()->role === 'siswa';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title'          => 'required|string|max:255',
            'description'    => 'required|string|max:5000',
            'repository_url' => 'nullable|url|max:500',
            'demo_url'       => 'nullable|url|max:500',
            'status'         => 'sometimes|in:planning,in_progress,review,completed,archived',
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date|after_or_equal:start_date',
            'tags'           => 'nullable|array|max:10',
            'tags.*'         => 'string|max:50',
            'visibility'     => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required'          => 'Judul project wajib diisi.',
            'title.max'               => 'Judul project maksimal 255 karakter.',
            'description.required'    => 'Deskripsi project wajib diisi.',
            'description.max'         => 'Deskripsi project maksimal 5000 karakter.',
            'repository_url.url'      => 'Format URL repository tidak valid.',
            'demo_url.url'            => 'Format URL demo tidak valid.',
            'status.in'               => 'Status project tidak valid.',
            'end_date.after_or_equal' => 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.',
            'tags.array'              => 'Tags harus berupa array.',
            'tags.max'                => 'Maksimal 10 tags.',
            'tags.*.max'              => 'Setiap tag maksimal 50 karakter.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title'          => 'judul project',
            'description'    => 'deskripsi',
            'repository_url' => 'URL repository',
            'demo_url'       => 'URL demo',
            'start_date'     => 'tanggal mulai',
            'end_date'       => 'tanggal selesai',
            'visibility'     => 'visibilitas',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Default status ke 'planning'
        $this->merge([
            'status' => $this->input('status', 'planning'),
        ]);

        // Default visibility ke true (public)
        $this->merge([
            'visibility' => $this->input('visibility', true),
        ]);

        // Default tags ke empty array jika null
        if ($this->input('tags') === null) {
            $this->merge(['tags' => []]);
        }
    }
}