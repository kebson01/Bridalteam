@extends('layouts.main')

@section('page')
	<div id="page">		
        <div class="page">				
            <header class="pageheader">
                <h1>Vendors</h1>
                <span class="overlay"></span>
            </header>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div id="vendorcategories">
                        <?php foreach($categories as $category): ?>                        
                            <article class="category">
                                <a href="/vendors/<?php print $category->slug; ?>">
                                    <span class="inner">
                                        <span class="categoryname"><?php print $category->name; ?></span>                                    
                                    </span>
                                </a>
                            </article>
                        <?php endforeach; ?>
                    </div>
                </div>	
            </div>			
        </div>
    </div>    
@endsection