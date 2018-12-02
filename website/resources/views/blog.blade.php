@extends('layouts.main')

@section('title')
<title><?php print $page->title->rendered; ?> - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
	<div id="page">		
        <div class="page blogposts">				
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="posts">
                        <article class="blogpost">
                            <header>
                                <div class="date"></div>
                                <h1 class="title"><a href="#">Testing testing, 1, 2, 3</a></h1>
                            </header>
                        </article>
                    </div>
                    <div class="sidebar"></div>
                    
                </div>	
            </div>			
        </div>
    </div>    
@endsection