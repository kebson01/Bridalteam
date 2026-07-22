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
                                    <div class="item" data-id="<?php print $m->id; ?>" data-type="<?php print $m->type; ?>">
                                        <div class="item-content">
                                            @if($m->type == 'video')
                                            <div class="image"><video src="/storage<?php print $m->urlpath; ?>" preload="metadata" muted playsinline></video><span class="playbadge"><i class="fa fa-play"></i></span></div>
                                            @else
                                            <div class="image"><img src="/storage<?php print $m->thumbnailpath; ?>" /></div>
                                            @endif
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
                <header>
                    <a id="btSaveInspiration" class="savebtn"><i class="fa fa-heart" aria-hidden="true"></i> Save to Board</a>
                    <a id="imagedisplay_close"><i class="fa fa-times" aria-hidden="true"></i></a>
                </header>
                <div class="imagecontent">
                    <div class="image"><a><img src="" /></a></div>
                    <div class="imageowner"></div>
                    <div class="tags"></div>
                    <div class="details">

                    </div>
                </div>
            </div>
        </div>
    </div>
    {{-- Mount point for the React "Save to Board" / bride-auth modals --}}
    <div id="gallerysaveroot"></div>
@endsection