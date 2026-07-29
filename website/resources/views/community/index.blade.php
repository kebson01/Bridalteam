@extends('layouts.main')

@section('title')
<title>Community - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
    <div id="page">
        <div id="community" class="page">
            <header class="pageheader">
                <h1>Community</h1>
                <span class="overlay"></span>
            </header>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">

                        <div class="community-toolbar" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-bottom:20px;">
                            <ul class="community-topics" style="list-style:none;display:flex;flex-wrap:wrap;gap:10px;padding:0;margin:0;">
                                <li><a class="btn {{ $topic ? '' : 'active' }}" href="/community">All</a></li>
                                @foreach($topics as $key => $label)
                                    <li><a class="btn {{ $topic === $key ? 'active' : '' }}" href="/community/topic/{{ $key }}">{{ $label }}</a></li>
                                @endforeach
                            </ul>
                            <a class="btn block" href="/community/new">Start a discussion</a>
                        </div>

                        @if(count($threads) === 0)
                            <p class="community-empty">No discussions yet. Be the first to start one!</p>
                        @else
                            <ul class="community-threads" style="list-style:none;padding:0;margin:0;">
                                @foreach($threads as $thread)
                                    <li class="community-thread-row" style="border-bottom:1px solid #eee;padding:16px 0;">
                                        <a href="/community/thread/{{ $thread->slug }}" style="font-size:1.2em;font-weight:bold;">{{ $thread->title }}</a>
                                        <div class="meta" style="color:#888;font-size:0.9em;margin-top:4px;">
                                            <span class="topic">{{ $topics[$thread->topic] ?? ucfirst($thread->topic) }}</span>
                                            &middot; by {{ $thread->author_name }}
                                            @if($thread->author_type === 'vendor')<span class="badge" style="color:#b48;">(Vendor)</span>@endif
                                            &middot; {{ $thread->reply_count }} {{ $thread->reply_count == 1 ? 'reply' : 'replies' }}
                                        </div>
                                    </li>
                                @endforeach
                            </ul>
                        @endif

                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
