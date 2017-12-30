@extends('layouts.main')

@section('head')
<script>var colorsjson = <?php print $colors; ?>;</script>
@endsection

@section('title')
<title>Gallery - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
	<div id="page">		
        <div class="page">				
            <header class="pageheader">
                <h1>Gallery</h1>
                <span class="overlay"></span>
            </header>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">
                        <div id="gallerysearch">
                            <div class="categories">
                                <select id="gallerycats">
                                    <option value="">No Category</option>
                                    @foreach($categories as $cat)
                                        <optgroup label="Category: {{$cat->name}}">
                                            <option value="{{$cat->id}}">{{$cat->name}}</option>
                                            @foreach($cat->subcats as $subcat)
                                                <option value="{{$subcat->id}}">{{$subcat->name}}</option>
                                            @endforeach
                                        </optgroup>
                                        
                                    @endforeach
                                </select>
                            </div>
                            <div class="themes">
                                <select id="gallerytheme">
                                    <option value="">No Theme</option>
                                    @foreach($themes as $theme)
                                        <option value="{{$theme->id}}">{{$theme->name}}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="colors">
                                <select id="gallerycolor" placeholder="No Color"></select>
                            </div>
                            <div class="keywords"><input type="search" id="gallerykeywords" placeholder="Search for inspiration..." /></div>
                        </div>
                        <div id="gallerygrid">
                            <div class="grid">
                                @foreach($media as $m)
                                    <?php $tags = explode(",", $m->keyword); ?>
                                    <div class="item" data-id="<?php print $m->id; ?>">
                                        <div class="item-content">
                                            <div class="image"><img src="/storage<?php print $m->thumbnailpath; ?>" /></div>
                                            <div class="tags">
                                                @foreach($tags as $tag)
                                                <span><a>{{$tag}}</a></span>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                @endforeach                                
                            </div>
                        </div>                        
                    </div>
                </div>	
            </div>			
        </div>
    </div>    
    <div id="imagedisplay">
        <div class="imagecover"></div>
        <div class="imagecontainer">
            <div class="innerwrapper">
                <header><a id="imagedisplay_close"><i class="fa fa-times" aria-hidden="true"></i></a></header>
                <div class="imagecontent">
                    <div class="image"><img src="" /></div>
                    <div class="tags"></div>
                </div>                
            </div>
        </div>
    </div>
@endsection