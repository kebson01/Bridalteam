@extends('layouts.main')

@section('title')
<title><?php print $page->title->rendered; ?> - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
	<div id="page">		
        <div class="page">				
            <header class="pageheader">
                <h1><?php print $page->title->rendered; ?></h1>
                <span class="overlay"></span>
            </header>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">
                        <?php print $page->content->rendered; ?>
                    </div>
                </div>	
            </div>			
        </div>
    </div>    
@endsection