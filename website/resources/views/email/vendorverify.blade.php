@extends('layouts.email')


@section('content')
<h2 style="text-align:center;"><img src="{{ $data['webdomain'] }}/wp-content/themes/bridalteam/img/email/email-title-confirmaddress.png" alt="Please Confirm your Email Address" /></h2>
<div style="width:480px;margin:auto;font-size:12px;color:#010101; font-family:helvetica, sans-serif;">
    <p>Thank you for registering your business with Bridal Team!<br/><br/>Click the link below to confirm your email address and start your free account:</p>
    <p><a style="color:#F47421;text-decoration:none;" href="{{ $data['webdomain'] }}/email-verify?verification={{ $data['verificationcode'] }}&v={{ $data['vendorid'] }}">{{ $data['webdomain'] }}/email-verify?verification={{ $data['verificationcode'] }}&v={{ $data['vendorid'] }}</a></p>
    <p>- Bridal Team</p>
    <p><a style="color:#F47421;text-decoration:none;" href="{{ $data['webdomain'] }}">www.bridalteam.com</a></p>
    <p></p>
</div>
@endsection