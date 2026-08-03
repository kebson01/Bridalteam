<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\User;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * Pass --revoke to remove admin privileges instead of granting them.
     *
     * @var string
     */
    protected $signature = 'user:make-admin {email : The email of the user to promote} {--revoke : Revoke admin access instead of granting it}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Grant (or revoke with --revoke) administrator privileges for a user by email';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $email = $this->argument('email');
        $revoke = (bool) $this->option('revoke');

        $user = User::where('email', '=', $email)->first();

        if (! $user) {
            $this->error("No user found with email: {$email}");
            return 1;
        }

        $user->is_admin = ! $revoke;
        $user->save();

        if ($revoke) {
            $this->info("Revoked admin privileges from {$email}.");
        } else {
            $this->info("Granted admin privileges to {$email}.");
        }

        return 0;
    }
}
