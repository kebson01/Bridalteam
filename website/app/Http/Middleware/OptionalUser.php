<?php

namespace App\Http\Middleware;

use Closure;
use JWTAuth;

/**
 * Soft authentication for public community pages.
 *
 * If a valid token cookie is present, the resolved App\User is attached to
 * the request (so views can show logged-in state, a reply box, "your posts",
 * etc.). If no/invalid token is present the request continues as a guest.
 * This middleware NEVER redirects — it is safe on indexable, public pages.
 */
class OptionalUser
{
    public function handle($request, Closure $next)
    {
        $request->user = null;

        $token = isset($_COOKIE['btvendortoken']) ? $_COOKIE['btvendortoken'] : '';
        if ($token !== '') {
            try {
                $request->user = JWTAuth::setToken($token)->authenticate();
            } catch (\Exception $e) {
                // Stale/invalid token — treat as an anonymous visitor.
                $request->user = null;
            }
        }

        return $next($request);
    }
}
