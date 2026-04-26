<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // HANYA SISWA yang bisa submit absensi
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
            'lat'        => 'required|numeric|between:-90,90',
            'lng'        => 'required|numeric|between:-180,180',
            'code'       => 'required|string|size:6',
            'photo_url'  => 'nullable|string|url|max:500',
            'device'     => 'nullable|string|in:web,android,ios',
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
            'lat.required'        => 'Latitude (koordinat lokasi) wajib diisi.',
            'lat.numeric'         => 'Latitude harus berupa angka.',
            'lat.between'         => 'Latitude tidak valid (harus antara -90 sampai 90).',
            'lng.required'        => 'Longitude (koordinat lokasi) wajib diisi.',
            'lng.numeric'         => 'Longitude harus berupa angka.',
            'lng.between'         => 'Longitude tidak valid (harus antara -180 sampai 180).',
            'code.required'       => 'Kode absensi wajib diisi.',
            'code.string'         => 'Kode absensi harus berupa teks.',
            'code.size'           => 'Kode absensi harus 6 karakter.',
            'photo_url.url'       => 'Format URL foto tidak valid.',
            'device.in'           => 'Device info tidak valid.',
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
            'lat'        => 'latitude',
            'lng'        => 'longitude',
            'code'       => 'kode absensi',
            'photo_url'  => 'foto',
            'device'     => 'device',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Auto uppercase kode absensi
        $this->merge([
            'code' => strtoupper($this->input('code')),
        ]);

        // Default device ke 'web' jika tidak dikirim
        $this->merge([
            'device' => $this->input('device', 'web'),
        ]);
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