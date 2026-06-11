<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use App\Models\ClassModel;
use App\Models\AttendanceSession;

class AttendanceFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_attendance_flow()
    {
        // Prepare storage and avatar file
        Storage::fake('public');

        $image = imagecreatetruecolor(100, 100);
        for ($x = 0; $x < 100; $x++) {
            for ($y = 0; $y < 100; $y++) {
                $color = imagecolorallocate($image, ($x * 3) % 256, ($y * 5) % 256, (($x + $y) * 2) % 256);
                imagesetpixel($image, $x, $y, $color);
            }
        }

        ob_start();
        imagejpeg($image, null, 90);
        $imageContent = ob_get_clean();
        imagedestroy($image);

        Storage::disk('public')->put('avatars/avatar.jpg', $imageContent);
        $avatarPath = Storage::disk('public')->path('avatars/avatar.jpg');

        // Create a selfie file from the same avatar content for face verification.
        Storage::disk('public')->put('avatars/selfie.jpg', $imageContent);
        $selfiePath = Storage::disk('public')->path('avatars/selfie.jpg');

        // Create a student user with avatar
        $user = User::create([
            'name' => 'Test Student',
            'email' => 'student@example.com',
            'password' => 'password',
            'role' => 'siswa',
            'avatar_url' => 'avatars/avatar.jpg',
        ]);

        // Create a teacher user to own the attendance session
        $teacher = User::create([
            'name' => 'Test Teacher',
            'email' => 'teacher@example.com',
            'password' => 'password',
            'role' => 'guru',
        ]);

        // Create supporting class and attendance session fixtures
        $class = ClassModel::create([
            'name' => 'Test Class',
            'level' => 'XII',
            'is_active' => true,
        ]);

        $session = AttendanceSession::create([
            'code' => 'ABC123',
            'class_id' => $class->id,
            'generated_by' => $teacher->id,
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
        $selfie = new UploadedFile($selfiePath, 'selfie.jpg', 'image/jpeg', null, true);
        $resp2 = $this->post('/api/v1/student/attendance/verify-face', [
            'attendance_record_id' => $recordId,
            'selfie' => $selfie,
        ]);
        var_export(['status' => $resp2->status(), 'body' => $resp2->json()]);
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
