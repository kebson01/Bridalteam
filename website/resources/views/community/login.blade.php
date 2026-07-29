@extends('layouts.main')

@section('title')
<title>Community Login - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
    <div id="page">
        <div id="communitylogin" class="page">
            <span class="overlay"></span>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">
                        <form id="memberloginform" class="form">
                            <h1>Log In</h1>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input class="form-input" type="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input class="form-input" type="password" name="password" required>
                            </div>
                            <div class="form-group">
                                <a class="btn block" id="memberLoginSubmit">Log In</a>
                                <a class="btn block" href="/community/register">Create an Account</a>
                            </div>
                            <div class="loginerror" style="color:#c00;display:none;"></div>
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
    $("#memberLoginSubmit").click(function () {
        var $form = $("#memberloginform");
        var email = $form.find("input[name=email]").val().trim();
        var password = $form.find("input[name=password]").val();
        if (email === "" || password === "") {
            $form.find(".loginerror").text("Email and password are required.").show();
            return false;
        }

        $.ajax({
            url: "/api/v1/community/login",
            method: "POST",
            data: { email: email, password: password },
            success: function (response) {
                Cookies.set('btvendortoken', response.token, { expires: 7 });
                window.location.href = "/community";
            },
            error: function () {
                $form.find(".loginerror").text("Invalid email or password.").show();
            }
        });
        return false;
    });
});
</script>
@endsection
