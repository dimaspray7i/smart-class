<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use App\Models\AttendanceSession;

class AttendanceFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_attendance_flow()
    {
        // Prepare storage and avatar file
        Storage::fake('public');
        $avatarPath = storage_path('app/public/avatars/avatar.jpg');
        if (!is_dir(dirname($avatarPath))) {
            mkdir(dirname($avatarPath), 0777, true);
        }
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=');
        file_put_contents($avatarPath, $png);

        // Create a student user with avatar
        $user = User::create([
            'name' => 'Test Student',
            'email' => 'student@example.com',
            'password' => 'password',
            'role' => 'siswa',
            'avatar_url' => '/storage/avatars/avatar.jpg',
        ]);

        // Create an active attendance session
        $session = AttendanceSession::create([
            'code' => 'ABC123',
            'is_active' => true,
            'valid_from' => now()->subMinutes(5),
            'valid_until' => now()->addMinutes(30),
        ]);

        // Authenticate as the student
        Sanctum::actingAs($user, ['*']);

        // 1. Verify code
        $resp = $this->postJson('/api/v1/student/attendance/verify-code', [
            'code' => $session->code,
        ]);
        $resp->assertStatus(200);
        $data = $resp->json('data');
        $this->assertArrayHasKey('attendance_record_id', $data);
        $recordId = $data['attendance_record_id'];

        // 2. Verify face (use same image as avatar to ensure high similarity)
        $selfie = new UploadedFile($avatarPath, 'selfie.jpg', null, null, true);
        $resp2 = $this->post('/api/v1/student/attendance/verify-face', [
            'attendance_record_id' => $recordId,
            'selfie' => $selfie,
        ]);
        $resp2->assertStatus(200);
        $this->assertEquals('FACE_VERIFIED', $resp2->json('code'));

        // 3. Verify location (use school coords from config)
        $lat = config('app.school_latitude', -6.200000);
        $lng = config('app.school_longitude', 106.816666);
        $resp3 = $this->postJson('/api/v1/student/attendance/verify-location', [
            'attendance_record_id' => $recordId,
            'lat' => $lat,
            'lng' => $lng,
            'accuracy' => 5,
        ]);
        $resp3->assertStatus(200);
        $this->assertEquals('LOCATION_VERIFIED', $resp3->json('code'));

        // 4. Complete check-in
        $resp4 = $this->postJson('/api/v1/student/attendance/check-in', [
            'attendance_record_id' => $recordId,
        ]);
        $resp4->assertStatus(200);
        $this->assertEquals('CHECKIN_SUCCESS', $resp4->json('code'));
    }
}
