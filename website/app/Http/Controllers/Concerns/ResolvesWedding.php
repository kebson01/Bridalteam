<?php

namespace App\Http\Controllers\Concerns;

use App\Wedding;
use JWTAuth;

/**
 * Shared helpers for couple-facing controllers: resolve the authenticated
 * user and load one of their weddings, enforcing ownership.
 */
trait ResolvesWedding
{
    protected function currentUser()
    {
        return JWTAuth::parseToken()->authenticate();
    }

    /**
     * Load a wedding the current user owns, or null if not found / not theirs.
     */
    protected function findOwnedWedding($weddingId)
    {
        $user = $this->currentUser();

        return Wedding::where('id', $weddingId)
            ->where('owner_user_id', $user->id)
            ->first();
    }
}
