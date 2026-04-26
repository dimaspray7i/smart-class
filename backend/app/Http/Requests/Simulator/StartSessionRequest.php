<?php

namespace App\Http\Requests\Simulator;

use Illuminate\Foundation\Http\FormRequest;

class StartSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // Simulator adalah PUBLIC - semua orang bisa akses
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'path_id'       => 'required|exists:career_paths,id',
            'start_step_id' => 'nullable|integer|exists:simulator_steps,id',
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
            'path_id.required'      => 'Jalur karir wajib dipilih.',
            'path_id.exists'        => 'Jalur karir tidak ditemukan.',
            'start_step_id.integer' => 'Step awal harus berupa angka.',
            'start_step_id.exists'  => 'Step awal tidak ditemukan.',
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
            'path_id'       => 'jalur karir',
            'start_step_id' => 'step awal',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Attach user_id jika sudah login (opsional)
        if ($this->user()) {
            $this->merge(['user_id' => $this->user()->id]);
        }
    }
}