@extends('layouts.email')


@section('content')
<h2 style="text-align:center;"><img src="{{ $data['webdomain'] }}/wp-content/themes/bridalteam/img/email/email-title-profilependingreview.png" alt="Profile Pending Review" /></h2>
<div style="width:480px;margin:auto;font-size:12px;color:#010101; font-family:helvetica, sans-serif;">
    <p>Thank you for creating your account and subscribing to Bridal Team!<br/>Your profile information has been received, and will be reviewed by our admins.</p>
    <p>You will be notified when your account has been approved.  Once your account is approved, it will become available for public viewing in our directory.</p>
    <p>- Bridal Team</p>
    <p><a style="color:#F47421;text-decoration:none;" href="{{ $data['webdomain'] }}">www.bridalteam.com</a></p>
    <p></p>
</div>
@endsection