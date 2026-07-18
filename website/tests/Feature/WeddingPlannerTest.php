<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\User;
use App\Wedding;
use JWTAuth;

/**
 * End-to-end coverage for the couple-facing MVP: register -> create a
 * wedding -> starter checklist is generated -> check a task off.
 *
 * Run with: php artisan migrate --seed && vendor/bin/phpunit --filter WeddingPlannerTest
 */
class WeddingPlannerTest extends TestCase
{
    use RefreshDatabase;

    protected function authHeader(User $user)
    {
        $token = JWTAuth::fromUser($user);
        return ['Authorization' => 'Bearer ' . $token];
    }

    public function testCoupleCanRegister()
    {
        $response = $this->json('POST', '/api/v1/couple/register', [
            'firstname' => 'Alex',
            'lastname'  => 'Rivera',
            'email'     => 'alex@example.com',
            'password'  => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['status', 'token', 'user']);

        $this->assertDatabaseHas('users', [
            'email'        => 'alex@example.com',
            'account_type' => 'couple',
        ]);
    }

    public function testCreatingAWeddingGeneratesAChecklist()
    {
        $this->seed(\TaskTemplatesSeeder::class);

        $user = factory(User::class)->create();

        $response = $this->json('POST', '/api/v1/couple/weddings', [
            'partner1_name'  => 'Alex',
            'partner2_name'  => 'Jordan',
            'wedding_date'   => now()->addMonths(10)->toDateString(),
            'guest_estimate' => 120,
            'budget_total'   => 30000,
        ], $this->authHeader($user));

        $response->assertStatus(201)
            ->assertJson(['status' => 'OK']);

        // A wedding with a date should generate tasks from the templates.
        $this->assertGreaterThan(0, $response->json('tasks_generated'));

        $weddingId = $response->json('wedding.id');
        $this->assertDatabaseHas('tasks', ['wedding_id' => $weddingId]);
    }

    public function testCheckingOffATaskUpdatesProgress()
    {
        $this->seed(\TaskTemplatesSeeder::class);
        $user = factory(User::class)->create();

        $create = $this->json('POST', '/api/v1/couple/weddings', [
            'partner1_name' => 'Alex',
            'wedding_date'  => now()->addMonths(6)->toDateString(),
        ], $this->authHeader($user));

        $weddingId = $create->json('wedding.id');

        $tasks = $this->json('GET', "/api/v1/couple/weddings/{$weddingId}/tasks", [], $this->authHeader($user));
        $firstTaskId = $tasks->json('tasks.0.id');

        $update = $this->json('PUT', "/api/v1/couple/weddings/{$weddingId}/tasks/{$firstTaskId}", [
            'status' => 'done',
        ], $this->authHeader($user));

        $update->assertStatus(200)
            ->assertJson(['status' => 'OK']);
        $this->assertGreaterThan(0, $update->json('progress.completed_tasks'));

        $this->assertDatabaseHas('tasks', [
            'id'     => $firstTaskId,
            'status' => 'done',
        ]);
    }

    public function testCanInviteAndAcceptACoPlanner()
    {
        $owner = factory(User::class)->create();
        $wedding = Wedding::create([
            'owner_user_id' => $owner->id,
            'partner1_name' => 'Alex',
            'status'        => 'planning',
        ]);

        $invite = $this->json('POST', "/api/v1/couple/weddings/{$wedding->id}/members", [
            'name'  => 'Sam',
            'email' => 'sam@example.com',
            'role'  => 'co_planner',
        ], $this->authHeader($owner));

        $invite->assertStatus(201);
        $token = $invite->json('invite_token');
        $this->assertNotEmpty($token);

        // A different user accepts the invite and gets linked to the wedding.
        $invitee = factory(User::class)->create();
        $accept = $this->json('POST', '/api/v1/couple/invites/accept', [
            'invite_token' => $token,
        ], $this->authHeader($invitee));

        $accept->assertStatus(200)
            ->assertJson(['status' => 'OK', 'wedding_id' => $wedding->id]);

        $this->assertDatabaseHas('wedding_members', [
            'wedding_id'    => $wedding->id,
            'user_id'       => $invitee->id,
            'invite_status' => 'accepted',
        ]);
    }

    public function testCannotAccessAnotherCouplesWedding()
    {
        $owner = factory(User::class)->create();
        $stranger = factory(User::class)->create();

        $wedding = Wedding::create([
            'owner_user_id' => $owner->id,
            'partner1_name' => 'Alex',
            'status'        => 'planning',
        ]);

        $response = $this->json('GET', "/api/v1/couple/weddings/{$wedding->id}", [], $this->authHeader($stranger));
        $response->assertStatus(404);
    }
}
