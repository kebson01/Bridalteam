<?php
namespace App\Classes;

use App\Vendor;
use App\User;
use Mail;

class EmailSystem{
    public static function sendVerificationEmail($vendorid){
        $domain = env('DOMAIN');
        $webdomain = env('WEBDOMAIN');
        
        $vendor = Vendor::find($vendorid);
        $user = User::find($vendor->user_id);
        
        $data = array(
            "domain" => $domain,
            "webdomain" => $webdomain,
            "to" => $user->email,
            "verificationcode" => $user->verification_code,
            "vendorid" => $vendorid,
            "name" => $user->fullname(),
            "businessname" => $vendor->businessname
        );
        
        Mail::send('email.vendorverify', ['data' => $data], function($m) use ($data){
            $m->to($data['to'], $data['name'])->subject("Welcome, " . $data['businessname'] . "!");
        });
    }

    public static function sendVendorEmail($vendorid, $msg){
        $domain = env('DOMAIN');
        $webdomain = env('WEBDOMAIN');
        
        $vendor = Vendor::find($vendorid);
        $user = User::find($vendor->user_id);
        
        $data = array(
            "domain" => $domain,
            "webdomain" => $webdomain,
            "to" => $user->email,
            "msg" => $msg,
            "name" => $user->fullname(),
            "businessname" => $vendor->businessname
        );
        
        Mail::send('email.vendoremail', ['data' => $data], function($m) use ($data){
            $m->to($data['to'], $data['name'])->subject("You have a new message");
        });
    }
}