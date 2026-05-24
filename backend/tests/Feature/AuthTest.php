<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthTest extends TestCase
{
    /**
     * Test login route triggers validation and does not throw middleware exception.
     */
    public function test_login_route_validation(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'invalid-email',
            'password' => '',
        ]);

        // Validation should fail (422), meaning the controller request lifecycle ran,
        // and it did not throw a 500 error due to undefined method middleware().
        $response->assertStatus(422);
    }
}
