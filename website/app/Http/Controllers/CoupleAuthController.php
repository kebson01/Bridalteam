<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\User;
use App\Wedding;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Registration and login for couples (planners). Reuses the shared `users`
 * table and the same JWT flow vendors use, tagging the account as a couple.
 */
class CoupleAuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firstname' => 'required|string|max:255',
            'lastname'  => 'required|string|max:255',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = new User();
        $user->name         = trim($request->firstname . ' ' . $request->lastname);
        $user->firstname    = $request->firstname;
        $user->lastname     = $request->lastname;
        $user->email        = $request->email;
        $user->password     = Hash::make($request->password);
        $user->account_type = 'couple';
        $user->save();

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'status' => 'OK',
            'token'  => $token,
            'user'   => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        try {
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json(['status' => 'error', 'error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['status' => 'error', 'error' => 'could_not_create_token'], 500);
        }

        return response()->json([
            'status' => 'OK',
            'token'  => $token,
        ]);
    }

    /**
     * Current couple account plus their weddings.
     */
    public function me()
    {
        $user = JWTAuth::parseToken()->authenticate();
        $weddings = Wedding::where('owner_user_id', $user->id)->get();

        return response()->json([
            'status'   => 'OK',
            'user'     => $user,
            'weddings' => $weddings,
        ]);
    }
}
