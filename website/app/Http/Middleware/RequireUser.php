<?php

namespace App\Http\Middleware;

use Closure;
use JWTAuth;

/**
 * Required authentication for community writes (post / reply / etc.).
 *
 * Any logged-in App\User qualifies — a plain member (couple/guest) or a
 * user who also owns a vendor. On failure this returns a 401 JSON body for
 * AJAX/API requests (so the front-end can prompt signup in place) and only
 * redirects for genuine full-page navigations.
 */
class RequireUser
{
    public function handle($request, Closure $next)
    {
        $token = isset($_COOKIE['btvendortoken']) ? $_COOKIE['btvendortoken'] : '';

        try {
            if ($token === '' || ! $user = JWTAuth::setToken($token)->authenticate()) {
                return $this->deny($request);
            }
            $request->user = $user;
            return $next($request);
        } catch (\Exception $e) {
            return $this->deny($request);
        }
    }

    private function deny($request)
    {
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json(['error' => 'auth_required'], 401);
        }

        return redirect('/community/login');
    }
}
