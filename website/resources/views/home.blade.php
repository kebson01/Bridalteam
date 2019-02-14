@extends('layouts.main')

@section('title')
<title>{{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
<div id="homepage">
    <div id="heroimage">
        <span class="overlay"></span>
        <div id="calltoaction">
            <h2>Start planning your wedding.</h2>
            <select>
                @foreach($categories as $category)
                <option value="{{$category->slug}}">{{$category->name}}</option>
                @endforeach
            </select>
        </div>
    </div>
    <section id="welcome">
        <div class="innerwrapper">
            <h1><?php print $page->title->rendered; ?></h1>
            <div class="content">                                             
                <?php print $page->content->rendered; ?>                
            </div>
        </div>
    </section>

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