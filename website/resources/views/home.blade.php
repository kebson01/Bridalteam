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
            <h1>Better Wedding Planning</h1>
            <div class="content">                                             
                <?php print $page->content->rendered; ?>                
            </div>
        </div>
    </section>
    <section id="highlight1" class="highlight odd">
        <div class="innerwrapper">
            <div class="content">
                <h1>Plan your Event</h1>
                <h2>Fun and easy wedding planning</h2>
                <p>Dress shopping.  Cake tasting.  Bridal party coordination.  Get all the tools you need to plan your big day like the professionals.  </p>
            </div>
        </div>			
    </section>
    <section id="highlight2" class="highlight">
        <div class="innerwrapper">
            <div class="content">
                <h1>Stay Connected</h1>
                <h2>Get regular updates about your wedding</h2>
                <p>Keep your bridesmaids and wedding planner on the same page with Bridal Team.  Share ideas, find vendors, and assign tasks on BridalTeam.com.</p>
            </div>
        </div>			
    </section>
    <section id="highlight3" class="highlight odd">
        <div class="innerwrapper">
            <div class="content">
                <h1>Get Inspired</h1>
                <h2>Find and share ideas</h2>
                <p>Looking for a lace dress?  A rustic venue?  DIY reception décor?  Browse thousands of images and videos for design ideas on the Gallery.</p>
            </div>
        </div>			
    </section>
</div>
@endsection