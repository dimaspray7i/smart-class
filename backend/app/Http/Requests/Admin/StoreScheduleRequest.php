<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA ADMIN yang bisa create schedule
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
            'class_id'    => 'required|exists:classes,id',
            'subject_id'  => 'required|exists:subjects,id',
            'teacher_id'  => 'required|exists:users,id',
            'day'         => 'required|in:senin,selasa,rabu,kamis,jumat,sabtu',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
            'room'        => 'nullable|string|max:50',
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
            'class_id.required'   => 'Kelas wajib dipilih.',
            'class_id.exists'     => 'Kelas tidak ditemukan.',
            'subject_id.required' => 'Mapel wajib dipilih.',
            'subject_id.exists'   => 'Mapel tidak ditemukan.',
            'teacher_id.required' => 'Guru wajib dipilih.',
            'teacher_id.exists'   => 'Guru tidak ditemukan.',
            'day.required'        => 'Hari wajib dipilih.',
            'day.in'              => 'Hari tidak valid.',
            'start_time.required' => 'Waktu mulai wajib diisi.',
            'start_time.date_format' => 'Format waktu mulai harus HH:MM (contoh: 08:00).',
            'end_time.required'   => 'Waktu selesai wajib diisi.',
            'end_time.date_format'  => 'Format waktu selesai harus HH:MM (contoh: 10:00).',
            'end_time.after'      => 'Waktu selesai harus setelah waktu mulai.',
            'room.max'            => 'Nama ruang maksimal 50 karakter.',
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
            'class_id'   => 'kelas',
            'subject_id' => 'mapel',
            'teacher_id' => 'guru',
            'day'        => 'hari',
            'start_time' => 'waktu mulai',
            'end_time'   => 'waktu selesai',
            'room'       => 'ruang',
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
    }
}