<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA ADMIN yang bisa create user
        // INI ADALAH SATU-SATUNYA CARA UNTUK BUAT AKUN (NO PUBLIC REGISTER!)
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|max:255|unique:users,email',
            'password'    => ['required', Password::min(8)->mixedCase()->numbers()],
            'role'        => 'required|in:admin,guru,siswa',
            'phone'       => 'nullable|string|max:20',
            'is_active'   => 'sometimes|boolean',
            
            // Profile fields (untuk siswa/guru)
            'nis'         => 'nullable|string|max:20|required_if:role,siswa|unique:profiles,nis',
            'nip'         => 'nullable|string|max:20|required_if:role,guru|unique:profiles,nip',
            'class_level' => 'nullable|in:X,XI,XII|required_if:role,siswa',
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
            'name.required'       => 'Nama wajib diisi.',
            'name.max'            => 'Nama maksimal 255 karakter.',
            'email.required'      => 'Email wajib diisi.',
            'email.email'         => 'Format email tidak valid.',
            'email.unique'        => 'Email sudah terdaftar.',
            'password.required'   => 'Password wajib diisi.',
            'password.min'        => 'Password minimal 8 karakter.',
            'role.required'       => 'Role wajib diisi.',
            'role.in'             => 'Role tidak valid (pilih: admin, guru, atau siswa).',
            'nis.required_if'     => 'NIS wajib diisi untuk siswa.',
            'nis.unique'          => 'NIS sudah terdaftar.',
            'nip.required_if'     => 'NIP wajib diisi untuk guru.',
            'nip.unique'          => 'NIP sudah terdaftar.',
            'class_level.required_if' => 'Tingkat kelas wajib diisi untuk siswa.',
            'class_level.in'      => 'Tingkat kelas tidak valid (pilih: X, XI, atau XII).',
            'github_url.url'      => 'Format URL GitHub tidak valid.',
            'linkedin_url.url'    => 'Format URL LinkedIn tidak valid.',
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
            'password'    => 'kata sandi',
            'role'        => 'role',
            'phone'       => 'nomor telepon',
            'nis'         => 'NIS',
            'nip'         => 'NIP',
            'class_level' => 'tingkat kelas',
            'github_url'  => 'URL GitHub',
            'linkedin_url'=> 'URL LinkedIn',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set default is_active ke true
        $this->merge([
            'is_active' => $this->input('is_active', true),
        ]);

        // Set nis/nip ke null jika tidak sesuai role
        if ($this->input('role') !== 'siswa') {
            $this->merge(['nis' => null]);
        }
        if ($this->input('role') !== 'guru') {
            $this->merge(['nip' => null]);
        }
    }
}