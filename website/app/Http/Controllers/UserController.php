<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use JWTAuth;

class UserController extends Controller
{
    public function getUserDetails(){
        $account = JWTAuth::parseToken()->authenticate();
        return response()->json([
            'status' => "OK", 
            "user" => $account
        ]);
    }
}