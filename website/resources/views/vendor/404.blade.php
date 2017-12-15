@extends('layouts.main')

@section('page')
<div id="page">
    <div id="vendor404" class="page">
        <header class="pageheader">
            <h1>404 - No Vendor Found</h1>
            <span class="overlay"></span>
        </header>
        <div id="pagebody">
            <div class="innerwrapper">
                <div class="content">
                    <h2>No vendor found at this page.<br/>Try searching for vendors here:</h2>
                    <a class="btn" href="/vendors">View All Vendor Categories</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection