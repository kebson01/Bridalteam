@extends('layouts.main')

@section('title')
<title>{{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
<div id="homepage">
    <div id="heroimage">          
        <ul class="slides">
            <?php if ($page && isset($page->acf->slideshow) && is_array($page->acf->slideshow)): ?>
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
            <?php else: ?>
                <!-- Fallback content when WordPress data is not available -->
                <li style="background-image: url('/img/herobg1.jpg');">
                    <div class="slidecontainer">
                        <div class="calltoaction">
                            <h2>FUN, SIMPLE WEDDING PLANNING.</h2>
                            <h3>Organize details.  Find ideas. Collaborate with your team.  All in one place!  Open your free account today.</h3>                            
                        </div>
                    </div>                    
                </li>
            <?php endif; ?>
        </ul>              
    </div>
    <section></section>
    <?php if ($page && isset($page->acf->highlights) && is_array($page->acf->highlights)): ?>
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
    <?php else: ?>
        <!-- Fallback content when WordPress data is not available -->
        <section style="background-image: url('/img/highlight_bg1.jpg');" class="highlight odd">
            <div class="innerwrapper">
                <div class="content">
                    <h1>Welcome to Bridal Team</h1>
                    <h2>Your Wedding Planning Partner</h2>
                    <p>Plan your perfect wedding with our comprehensive tools and expert guidance.</p>
                </div>
            </div>			
        </section>
    <?php endif; ?>
</div>
@endsection