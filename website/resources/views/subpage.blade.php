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

                    <?php if (isset($page->acf->sections) && count($page->acf->sections) > 0): ?>
                        <div id="tools">
                            <?php foreach ($page->acf->sections as $section): ?>                                
                                <section class="tools">                                    
                                    <h1><?php print $section->title; ?></h1>
                                    <ul>
                                        <?php foreach($section->tool_links as $tool): ?>
                                            <li>
                                                <a target="<?php print $tool->link->target; ?>" href="<?php print $tool->link->url; ?>"><?php print $tool->link->title; ?></a>
                                                <span><?php print $tool->description; ?></span>
                                            </li>     
                                        <?php endforeach; ?>
                                                                    
                                    </ul>
                                </section>                        
                            <?php endforeach; ?>
                        </div>                        
                    <?php endif; ?>
                </div>	
            </div>			
        </div>
    </div>    
@endsection