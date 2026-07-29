@extends('layouts.main')

@section('title')
<title>{{ $thread->title }} - Community - {{ env('SEO_SITETITLE') }}</title>
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

                        <p><a href="/community">&larr; Back to Community</a></p>

                        <article class="community-post" style="border-bottom:2px solid #eee;padding-bottom:20px;margin-bottom:20px;">
                            <h2 style="margin-bottom:6px;">{{ $thread->title }}</h2>
                            <div class="meta" style="color:#888;font-size:0.9em;margin-bottom:14px;">
                                <span class="topic">{{ $topics[$thread->topic] ?? ucfirst($thread->topic) }}</span>
                                &middot; by {{ $thread->author_name }}
                                @if($thread->author_type === 'vendor')<span class="badge" style="color:#b48;">(Vendor)</span>@endif
                            </div>
                            <div class="body">{!! nl2br(e($thread->body)) !!}</div>
                        </article>

                        <h3>{{ count($replies) }} {{ count($replies) == 1 ? 'Reply' : 'Replies' }}</h3>
                        <ul class="community-replies" style="list-style:none;padding:0;margin:0 0 24px;">
                            @foreach($replies as $reply)
                                <li class="community-reply" style="border-bottom:1px solid #eee;padding:14px 0;">
                                    <div class="meta" style="color:#888;font-size:0.85em;margin-bottom:6px;">
                                        {{ $reply->author_name }}
                                        @if($reply->author_type === 'vendor')<span class="badge" style="color:#b48;">(Vendor)</span>@endif
                                    </div>
                                    <div class="body">{!! nl2br(e($reply->body)) !!}</div>
                                </li>
                            @endforeach
                        </ul>

                        @if(!empty($user))
                            <form id="replyform" class="form" data-thread="{{ $thread->id }}">
                                <div class="form-group">
                                    <label class="form-label">Add a reply</label>
                                    <textarea class="form-input" name="body" rows="4" required></textarea>
                                </div>
                                <div class="form-group">
                                    <a class="btn block" id="replySubmit">Post Reply</a>
                                </div>
                                <div class="replyerror" style="color:#c00;display:none;"></div>
                            </form>
                        @else
                            <div class="community-signup-prompt" style="background:#faf6f8;padding:20px;text-align:center;">
                                <p><strong>Join the conversation.</strong> Sign up to reply and start your own discussions.</p>
                                <a class="btn block" href="/community/register">Sign up</a>
                                <a class="btn block" href="/community/login">Log in</a>
                            </div>
                        @endif

                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('head')
<script>
$(function () {
    $("#replySubmit").click(function () {
        var $form = $("#replyform");
        var body = $form.find("textarea[name=body]").val().trim();
        if (body === "") { return false; }

        $.ajax({
            url: "/api/v1/community/thread/" + $form.data("thread") + "/reply",
            method: "POST",
            data: { body: body },
            success: function (response) {
                window.location.href = response.redirect || window.location.href;
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    window.location.href = "/community/register";
                    return;
                }
                var msg = (xhr.responseJSON && xhr.responseJSON.error) || "There was a problem posting your reply.";
                $form.find(".replyerror").text(msg).show();
            }
        });
        return false;
    });
});
</script>
@endsection
