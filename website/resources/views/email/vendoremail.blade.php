@extends('layouts.email')

@section('content')
<h2 style="text-align:center;"><img src="{{ $data['webdomain'] }}/wp-content/themes/bridalteam/img/email/email-title-newmessage.png" alt="Please Confirm your Email Address" /></h2>
<div style="width:480px;margin:auto;font-size:12px;color:#010101; font-family:helvetica, sans-serif;">
    {!! $data['msg'] !!}    
    <p>- Bridal Team</p>
    <p><a style="color:#F47421;text-decoration:none;" href="{{ $data['webdomain'] }}">www.bridalteam.com</a></p>
    <p></p>
</div>
@endsection