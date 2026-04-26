<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSubjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA ADMIN yang bisa create subject
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
            'code'        => 'required|string|max:50|unique:subjects,code',
            'name'        => 'required|string|max:255',
            'category'    => 'required|in:productive,normative,adaptive',
            'credits'     => 'sometimes|integer|min:1|max:10',
            'description' => 'nullable|string|max:1000',
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
            'code.required'     => 'Kode mapel wajib diisi.',
            'code.unique'       => 'Kode mapel sudah digunakan.',
            'name.required'     => 'Nama mapel wajib diisi.',
            'category.required' => 'Kategori mapel wajib diisi.',
            'category.in'       => 'Kategori tidak valid (pilih: productive, normative, atau adaptive).',
            'credits.integer'   => 'Kredit harus berupa angka.',
            'credits.min'       => 'Kredit minimal 1.',
            'credits.max'       => 'Kredit maksimal 10.',
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
            'code'        => 'kode mapel',
            'name'        => 'nama mapel',
            'category'    => 'kategori',
            'credits'     => 'kredit',
            'description' => 'deskripsi',
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

        // Default credits ke 4 jika tidak diisi
        if (!$this->input('credits')) {
            $this->merge(['credits' => 4]);
        }
    }
}