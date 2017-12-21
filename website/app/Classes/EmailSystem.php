<?php
namespace App\Classes;

use App\Vendor;
use App\VendorClaim;
use App\User;
use Mail;

class EmailSystem{

    public static function sendAdminEmail($subject, $msg){
        $adminemails = explode(',', env('ADMIN_EMAILS'));


        $data = array(
            'subject' => $subject,
            'msg' => $msg,
            'to' => $adminemails
        );

        Mail::send('email.admin', ['data' => $data], function ($m) use ($data){
            $m->to($data['to'])->subject($data['subject']);
        });
    }

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

    public static function sendVendorClaimEmail($claimid, $msg){
        $domain = env('DOMAIN');
        $webdomain = env('WEBDOMAIN');
        
        $vendor = VendorClaim::find($claimid);
        $user = User::find($vendor->user_id);
        
        $data = array(
            "domain" => $domain,
            "webdomain" => $webdomain,
            "to" => $user->email,
            "msg" => $msg,
            "name" => $user->fullname(),
            "businessname" => $vendor->businessname
        );
        
        Mail::send('email.vendorclaim', ['data' => $data], function($m) use ($data){
            $m->to($data['to'], $data['name'])->subject("Your profile claim is pending");
        });
    }

    public static function sendVendorReviewNotice($vendorid){
        $domain = env('DOMAIN');
        $webdomain = env('WEBDOMAIN');
        
        $vendor = VendorClaim::find($vendorid);
        $user = User::find($vendor->user_id);
        
        $data = array(
            "domain" => $domain,
            "webdomain" => $webdomain,
            "to" => $user->email,            
            "name" => $user->fullname(),
            "businessname" => $vendor->businessname
        );
        
        Mail::send('email.vendorreview', ['data' => $data], function($m) use ($data){
            $m->to($data['to'], $data['name'])->subject("Your profile is being reviewed");
        });
    }

    public static function sendVendorTransactionalNotice($vendorid, $type){
        $domain = env('DOMAIN');
        $webdomain = env('WEBDOMAIN');
        
        $vendor = Vendor::find($vendorid);
        $user = User::find($vendor->user_id);

        $template = "";
        $subject = "";

        switch($type){
            case "profileapproved":
                $template = "email.vendorapproved";
                $subject = "Your profile has been approved!";
                break;
            case "mediaapproved":
                $template = "email.mediaapproved";
                $subject = "Your media image/video has been approved!";
                break;
            default:
                break;
        }

        $data = array(
            "domain" => $domain,
            "webdomain" => $webdomain,
            "to" => $user->email,            
            "name" => $user->fullname(),
            "businessname" => $vendor->businessname,
            "slug" => $vendor->slug
        );

        Mail::send($template, ['data' => $data], function($m) use ($data, $subject){
            $m->to($data['to'], $data['name'])->subject($subject);
        });
    }
}