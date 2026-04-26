<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA ADMIN yang bisa update user
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user');

        return [
            'name'      => 'sometimes|required|string|max:255',
            'email'     => 'sometimes|required|email|max:255|unique:users,email,' . $userId,
            'phone'     => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
            'role'      => 'sometimes|in:admin,guru,siswa',
            
            // Profile fields
            'nis'         => 'nullable|string|max:20|unique:profiles,nis,' . $userId . ',user_id',
            'nip'         => 'nullable|string|max:20|unique:profiles,nip,' . $userId . ',user_id',
            'class_level' => 'nullable|in:X,XI,XII',
            'bio'         => 'nullable|string|max:1000',
            'github_url'  => 'nullable|url|max:255',
            'linkedin_url'=> 'nullable|url|max:255',
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
            'name.required'  => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email'    => 'Format email tidak valid.',
            'email.unique'   => 'Email sudah digunakan user lain.',
            'role.in'        => 'Role tidak valid.',
            'nis.unique'     => 'NIS sudah terdaftar.',
            'nip.unique'     => 'NIP sudah terdaftar.',
            'class_level.in' => 'Tingkat kelas tidak valid.',
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
            'name'        => 'nama',
            'email'       => 'email',
            'phone'       => 'nomor telepon',
            'role'        => 'role',
            'nis'         => 'NIS',
            'nip'         => 'NIP',
            'class_level' => 'tingkat kelas',
        ];
    }

    /**
     * Handle a failed validation attempt.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        // Laravel akan handle otomatis dengan JSON response untuk API
        parent::failedValidation($validator);
    }
}