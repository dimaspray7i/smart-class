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
        DB::table('subjects')->truncate();
        DB::table('classes')->truncate();

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
        // 3. SUBJECTS (Mata Pelajaran)
        // ───────────────────────────────────────────────
        $subjectsData = [
            // Produktif
            ['code' => 'RPL-101', 'name' => 'Dasar Pemrograman',             'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-102', 'name' => 'Pemrograman Web Dasar',          'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-103', 'name' => 'Pemrograman Web Lanjutan',       'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-104', 'name' => 'Basis Data',                     'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-105', 'name' => 'Pemrograman Berorientasi Objek', 'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-106', 'name' => 'Rekayasa Perangkat Lunak',       'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-107', 'name' => 'Pemrograman Mobile',             'category' => 'productive', 'credits' => 4],
            ['code' => 'RPL-108', 'name' => 'Keamanan Siber',                 'category' => 'productive', 'credits' => 2],
            ['code' => 'RPL-109', 'name' => 'Jaringan Komputer Dasar',        'category' => 'productive', 'credits' => 2],
            ['code' => 'RPL-110', 'name' => 'Proyek Perangkat Lunak',         'category' => 'productive', 'credits' => 6],
            // Normatif
            ['code' => 'NOR-101', 'name' => 'Pendidikan Agama Islam',         'category' => 'normative',  'credits' => 3],
            ['code' => 'NOR-102', 'name' => 'Pendidikan Pancasila',           'category' => 'normative',  'credits' => 2],
            ['code' => 'NOR-103', 'name' => 'Bahasa Indonesia',               'category' => 'normative',  'credits' => 4],
            ['code' => 'NOR-104', 'name' => 'Pendidikan Jasmani & Olahraga',  'category' => 'normative',  'credits' => 3],
            ['code' => 'NOR-105', 'name' => 'Sejarah Indonesia',              'category' => 'normative',  'credits' => 2],
            // Adaptif
            ['code' => 'ADP-101', 'name' => 'Matematika',                    'category' => 'adaptive',   'credits' => 4],
            ['code' => 'ADP-102', 'name' => 'Bahasa Inggris',                 'category' => 'adaptive',   'credits' => 4],
            ['code' => 'ADP-103', 'name' => 'Fisika',                         'category' => 'adaptive',   'credits' => 2],
            ['code' => 'ADP-104', 'name' => 'Kewirausahaan',                  'category' => 'adaptive',   'credits' => 2],
            ['code' => 'ADP-105', 'name' => 'Seni Budaya',                    'category' => 'adaptive',   'credits' => 2],
        ];

        $subjects = [];
        foreach ($subjectsData as $s) {
            $subject = Subject::create([
                'code'        => $s['code'],
                'name'        => $s['name'],
                'category'    => $s['category'],
                'credits'     => $s['credits'],
                'description' => null,
                'is_active'   => true,
            ]);
            $subjects[$s['code']] = $subject;
        }
        $this->command->info('✅ ' . count($subjectsData) . ' mata pelajaran berhasil dibuat.');

        // ───────────────────────────────────────────────
        // 4. CLASSES (Kelas)
        // ───────────────────────────────────────────────
        $classesData = [
            ['name' => 'RPL X-1',   'level' => 'X',   'capacity' => 36],
            ['name' => 'RPL X-2',   'level' => 'X',   'capacity' => 36],
            ['name' => 'RPL X-3',   'level' => 'X',   'capacity' => 36],
            ['name' => 'RPL XI-1',  'level' => 'XI',  'capacity' => 36],
            ['name' => 'RPL XI-2',  'level' => 'XI',  'capacity' => 36],
            ['name' => 'RPL XI-3',  'level' => 'XI',  'capacity' => 36],
            ['name' => 'RPL XII-1', 'level' => 'XII', 'capacity' => 36],
            ['name' => 'RPL XII-2', 'level' => 'XII', 'capacity' => 36],
            ['name' => 'RPL XII-3', 'level' => 'XII', 'capacity' => 36],
        ];

        foreach ($classesData as $c) {
            ClassModel::create([
                'name'        => $c['name'],
                'slug'        => \Illuminate\Support\Str::slug($c['name']),
                'level'       => $c['level'],
                'description' => 'Kelas ' . $c['name'] . ' Program Keahlian RPL',
                'capacity'    => $c['capacity'],
                'is_active'   => true,
            ]);
        }
        $this->command->info('✅ ' . count($classesData) . ' kelas berhasil dibuat.');

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
        // Assign 3 subjects to teacher
        $teacherProfile->subjects()->sync([
            $subjects['RPL-101']->id,
            $subjects['RPL-102']->id,
            $subjects['RPL-104']->id,
        ]);
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
        $class = ClassModel::where('name', 'RPL XI-1')->first();
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
