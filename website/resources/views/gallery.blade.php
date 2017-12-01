@extends('layouts.main')

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
                            <input type="search" placeholder="Search for inspiration..." />
                        </div>
                        <div id="gallerygrid">
                            <div class="grid">
                                @foreach($media as $m)
                                    <?php $tags = explode(",", $m->media->keyword); ?>
                                    <div class="item" data-id="<?php print $m->id; ?>">
                                        <div class="item-content">
                                            <div class="image"><img src="/storage<?php print $m->media->thumbnailpath; ?>" /></div>
                                            <div class="tags">
                                                @foreach($tags as $tag)
                                                <span><a>{{$tag}}</a></span>
                                                @endforeach
                                            </div>
                                        </div>
                                    </div>
                                @endforeach
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/640/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/550/1024/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/720/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/640/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/550/1024/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/720/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/640/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/550/1024/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/720/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/640/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/550/1024/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="item">
                                    <div class="item-content">
                                        <div class="image"><img src="http://placeimg.com/720/480/any" /></div>
                                        <div class="tags">
                                            <span><a>Test</a></span>
                                            <span><a>Testing</a></span>
                                            <span><a>FPO</a></span>
                                        </div>
                                    </div>
                                </div>
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