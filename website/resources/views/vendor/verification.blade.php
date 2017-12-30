@extends('layouts.main')

@section('title')
<title>Verification - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
<div id="page">
    <div id="vendorregister" class="page">
        <header class="pageheader">
            <h1>Register as a Vendor</h1>
            <span class="overlay"></span>
        </header>
        <div id="pagebody">
            <div id="verificationapp"></div>
        </div>
    </div>
</div>
@endsection