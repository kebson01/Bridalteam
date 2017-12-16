@extends('layouts.email')

@section('content')
<h2 style="text-align:center;"><img src="{{ $data['webdomain'] }}/wp-content/themes/bridalteam/img/email/email-title-mediareviewed.png" alt="Your media has been reviewed" /></h2>
<div style="width:480px;margin:auto;font-size:12px;color:#010101; font-family:helvetica, sans-serif;">
    <p>Your image/video has been approved!  You can view it publicly on your profile at the the link below:</p>
    <p><a style="color:#F47421;text-decoration:none;" href="/vendor/{{ $data['slug'] }}">{{ $data['businessname'] }}</a></p>
    <p>- Bridal Team</p>
    <p><a style="color:#F47421;text-decoration:none;" href="{{ $data['webdomain'] }}">www.bridalteam.com</a></p>
    <p></p>
</div>
@endsection