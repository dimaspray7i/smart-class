<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\Subject;
use App\Models\ClassModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // ───────────────────────────────────────────────
        // 1. CLEAR OLD DATA (safe reset)
        // ───────────────────────────────────────────────
        DB::table('profile_subject')->truncate();
        DB::table('class_user')->truncate();
        DB::table('class_subject')->truncate();
        DB::table('personal_access_tokens')->truncate();
        DB::table('profiles')->truncate();
        DB::table('users')->truncate();
        // NOTE: Subject and Class tables are intentionally NOT truncated here
        // to avoid accidental data loss in production. Seeding of subjects
        // and classes has been removed to let migrations / manual data manage them.

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ───────────────────────────────────────────────
        // 2. ADMIN USER
        // ───────────────────────────────────────────────
        $admin = User::create([
            'name'       => 'Admin RPL SMKN1',
            'email'      => 'adminrplsmkn1tm@gmail.com',
            'password'   => Hash::make('rpljuara'),
            'role'       => 'admin',
            'phone'      => '08123456789',
            'is_active'  => true,
        ]);
        Profile::create([
            'user_id' => $admin->id,
            'bio'     => 'Administrator RPL Smart Ecosystem',
        ]);
        $this->command->info("✅ Admin: {$admin->email} | Password: rpljuara");

        // ───────────────────────────────────────────────
        // NOTE: Mata pelajaran (subjects) seeding removed.
        // Existing subjects should be managed via migrations or manual import.
        // ───────────────────────────────────────────────

        // ───────────────────────────────────────────────
        // NOTE: Kelas (classes) seeding removed.
        // Manage class records via migrations or manual admin interface.
        // ───────────────────────────────────────────────

        // ───────────────────────────────────────────────
        // 5. SAMPLE TEACHER
        // ───────────────────────────────────────────────
        $teacher = User::create([
            'name'      => 'Budi Santoso, S.Kom',
            'email'     => 'budi.guru@rpl.id',
            'password'  => Hash::make('password123'),
            'role'      => 'guru',
            'phone'     => '08112345678',
            'is_active' => true,
        ]);
        $teacherProfile = Profile::create([
            'user_id' => $teacher->id,
            'nip'     => '198501012010011001',
            'bio'     => 'Guru Produktif RPL',
        ]);
        // Assign subjects to teacher if subjects seeded exist
        try {
            if (class_exists(Subject::class)) {
                $existing = Subject::whereIn('code', ['RPL-101','RPL-102','RPL-104'])->pluck('id')->toArray();
                if (!empty($existing)) {
                    $teacherProfile->subjects()->sync($existing);
                }
            }
        } catch (\Throwable $e) {
            // If subjects table doesn't exist or other DB issue, skip gracefully
            $this->command->warn('⚠️ Skipping subject sync for sample teacher: ' . $e->getMessage());
        }
        $this->command->info("✅ Sample guru: {$teacher->email} | Password: password123");

        // ───────────────────────────────────────────────
        // 6. SAMPLE STUDENT
        // ───────────────────────────────────────────────
        $student = User::create([
            'name'      => 'Dimas Prayogi',
            'email'     => 'dimas.siswa@rpl.id',
            'password'  => Hash::make('password123'),
            'role'      => 'siswa',
            'phone'     => '08987654321',
            'is_active' => true,
        ]);
        $class = ClassModel::where('name', 'RPL FutureLabs')->first() ?? ClassModel::where('level', 'XI')->first();
        $studentProfile = Profile::create([
            'user_id'     => $student->id,
            'nis'         => '2024001001',
            'class_level' => 'XI',
            'bio'         => 'Siswa kelas XI RPL',
        ]);
        if ($class) {
            $student->classes()->attach($class->id, [
                'role_in_class' => 'siswa',
                'academic_year' => date('Y'),
                'is_active'     => true,
            ]);
            $teacher->classes()->attach($class->id, [
                'role_in_class' => 'wali_kelas',
                'academic_year' => date('Y'),
                'is_active'     => true,
            ]);
        } else {
            $this->command->warn('⚠️ Kelas RPL FutureLabs tidak ditemukan. Lewati attach siswa ke kelas.');
        }
        $this->command->info("✅ Sample siswa: {$student->email} | Password: password123");

        $this->command->info('');
        $this->command->info('═══════════════════════════════════════════');
        $this->command->info('  SEEDING SELESAI! ');
        $this->command->info('  Admin: adminrplsmkn1tm@gmail.com / rpljuara');
        $this->command->info('  Guru : budi.guru@rpl.id / password123');
        $this->command->info('  Siswa: dimas.siswa@rpl.id / password123');
        $this->command->info('═══════════════════════════════════════════');
    }
}
