@extends('layouts.main')

@section('title')
<title>{{ $page->title ?? 'Blog' }} - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
	<div id="page">		
        <div class="page blogposts">				
            <header class="pageheader">
                <h1>{{ $page->title ?? 'Wedding Blog' }}</h1>
                <span class="overlay"></span>
            </header>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="posts">
                        <article class="blogpost">
                            <header>
                                <div class="date">{{ date('F j, Y') }}</div>
                                <h1 class="title">{{ $page->title ?? 'Wedding Blog' }}</h1>
                            </header>
                            <div class="content">
                                <p>{{ $page->content ?? 'Wedding planning tips and inspiration coming soon!' }}</p>
                            </div>
                        </article>
                    </div>
                    <div class="sidebar">
                        <h3>Categories</h3>
                        <ul>
                            <li><a href="#">Wedding Planning</a></li>
                            <li><a href="#">Venue Selection</a></li>
                            <li><a href="#">Photography</a></li>
                            <li><a href="#">Catering</a></li>
                        </ul>
                    </div>
                </div>	
            </div>			
        </div>
    </div>    
@endsection