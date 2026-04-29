<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin already exists
        if (User::where('email', 'admin@rpl.id')->exists()) {
            $this->command->info('Admin user already exists!');
            return;
        }

        // Create admin user
        $admin = User::create([
            'name' => 'ADMIN RPL COMPILER',
            'email' => 'rplsmkn1@gmail.com',
            'password' => Hash::make('rpljuara'),
            'role' => 'admin',
            'phone' => '08123456789',
            'is_active' => true,
        ]);

        // Create profile for admin
        Profile::create([
            'user_id' => $admin->id,
            'bio' => 'Administrator RPL Smart Ecosystem',
        ]);

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: rplsmkn1@gmail.com');
        $this->command->info('Password: rpljuara');
    }
}