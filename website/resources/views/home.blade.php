@extends('layouts.main')

@section('title')
<title>{{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
<div id="homepage">
    <div id="heroimage">          
        <ul class="slides">
            <?php foreach ($page->acf->slideshow as $slide): ?>
                <li style="background-image: url('<?php print $slide->image; ?>');'">
                    <div class="slidecontainer">
                        <div class="calltoaction">
                            <h2>FUN, SIMPLE WEDDING PLANNING.</h2>
                            <h3>Organize details.  Find ideas. Collaborate with your team.  All in one place!  Open your free account today.</h3>                            
                        </div>
                    </div>                    
                </li>
            <?php endforeach; ?>
        </ul>              
    </div>
    <?php foreach ($page->acf->highlights as $highlight): ?>
        <section style="background-image: url('<?php print $highlight->image_background; ?>');" class="highlight odd">
            <div class="innerwrapper">
                <div class="content">
                    <h1><?php print $highlight->title; ?></h1>
                    <h2><?php print $highlight->sub_title; ?></h2>
                    <?php print $highlight->content; ?>
                </div>
            </div>			
        </section>
    <?php endforeach; ?>
</div>
@endsection