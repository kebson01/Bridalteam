@extends('layouts.main')

@section('title')
<title>Start a Discussion - Community - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
    <div id="page">
        <div id="community" class="page">
            <header class="pageheader">
                <h1>Start a Discussion</h1>
                <span class="overlay"></span>
            </header>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">

                        <form id="threadform" class="form">
                            <div class="form-group">
                                <label class="form-label">Topic</label>
                                <select class="form-input" name="topic">
                                    @foreach($topics as $key => $label)
                                        <option value="{{ $key }}">{{ $label }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Title</label>
                                <input class="form-input" type="text" name="title" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Message</label>
                                <textarea class="form-input" name="body" rows="8" required></textarea>
                            </div>
                            <div class="form-group">
                                <a class="btn block" id="threadSubmit">Post Discussion</a>
                            </div>
                            <div class="threaderror" style="color:#c00;display:none;"></div>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('head')
<script>
$(function () {
    $("#threadSubmit").click(function () {
        var $form = $("#threadform");
        var title = $form.find("input[name=title]").val().trim();
        var body = $form.find("textarea[name=body]").val().trim();
        if (title === "" || body === "") {
            $form.find(".threaderror").text("Title and message are required.").show();
            return false;
        }

        $.ajax({
            url: "/api/v1/community/thread",
            method: "POST",
            data: {
                topic: $form.find("select[name=topic]").val(),
                title: title,
                body: body
            },
            success: function (response) {
                window.location.href = response.redirect || "/community";
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    window.location.href = "/community/register";
                    return;
                }
                var msg = (xhr.responseJSON && xhr.responseJSON.error) || "There was a problem posting your discussion.";
                $form.find(".threaderror").text(msg).show();
            }
        });
        return false;
    });
});
</script>
@endsection
