<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreClassRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA ADMIN yang bisa create class
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
            'level'       => 'required|in:X,XI,XII',
            'description' => 'nullable|string|max:1000',
            'capacity'    => 'sometimes|integer|min:1|max:50',
            'is_active'   => 'sometimes|boolean',
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
            'name.required'     => 'Nama kelas wajib diisi.',
            'name.max'          => 'Nama kelas maksimal 255 karakter.',
            'level.required'    => 'Tingkat kelas wajib diisi.',
            'level.in'          => 'Tingkat kelas tidak valid (pilih: X, XI, atau XII).',
            'description.max'   => 'Deskripsi maksimal 1000 karakter.',
            'capacity.integer'  => 'Kapasitas harus berupa angka.',
            'capacity.min'      => 'Kapasitas minimal 1 siswa.',
            'capacity.max'      => 'Kapasitas maksimal 50 siswa.',
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
            'name'        => 'nama kelas',
            'level'       => 'tingkat kelas',
            'description' => 'deskripsi',
            'capacity'    => 'kapasitas',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Default is_active ke true
        $this->merge([
            'is_active' => $this->input('is_active', true),
        ]);

        // Default capacity ke 36 jika tidak diisi
        if (!$this->input('capacity')) {
            $this->merge(['capacity' => 36]);
        }
    }
}