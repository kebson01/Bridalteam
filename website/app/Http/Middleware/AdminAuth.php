<?php

namespace App\Http\Middleware;

use Closure;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AdminAuth
{
    /**
     * Handle an incoming request.
     *
     * Requires a valid JWT belonging to a user flagged as an administrator.
     * Fails closed: any missing/invalid token or non-admin user is rejected.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (JWTException $e) {
            return response()->json([
                'status'  => 'Error',
                'message' => 'Authentication required.',
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'Error',
                'message' => 'Authentication required.',
            ], 401);
        }

        if (! $user) {
            return response()->json([
                'status'  => 'Error',
                'message' => 'Authentication required.',
            ], 401);
        }

        if (! $user->is_admin) {
            return response()->json([
                'status'  => 'Error',
                'message' => 'Administrator privileges required.',
            ], 403);
        }

        $request->user = $user;

        return $next($request);
    }
}
