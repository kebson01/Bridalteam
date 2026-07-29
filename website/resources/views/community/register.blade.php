@extends('layouts.main')

@section('title')
<title>Join the Community - {{ env('SEO_SITETITLE') }}</title>
@endsection

@section('page')
    <div id="page">
        <div id="communityregister" class="page">
            <span class="overlay"></span>
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">
                        <form id="memberregisterform" class="form">
                            <h1>Join the Community</h1>
                            <p>Create a free account to reply and start discussions. Planning a wedding? This is your space.</p>
                            <div class="form-group">
                                <label class="form-label">First Name</label>
                                <input class="form-input" type="text" name="firstname" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Last Name</label>
                                <input class="form-input" type="text" name="lastname">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input class="form-input" type="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input class="form-input" type="password" name="password" required>
                            </div>
                            <div class="form-group">
                                <a class="btn block" id="memberRegisterSubmit">Create Account</a>
                                <a class="btn block" href="/community/login">Already have an account? Log in</a>
                            </div>
                            <div class="registererror" style="color:#c00;display:none;"></div>
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
    $("#memberRegisterSubmit").click(function () {
        var $form = $("#memberregisterform");
        var data = {
            firstname: $form.find("input[name=firstname]").val().trim(),
            lastname: $form.find("input[name=lastname]").val().trim(),
            email: $form.find("input[name=email]").val().trim(),
            password: $form.find("input[name=password]").val()
        };
        if (data.firstname === "" || data.email === "" || data.password === "") {
            $form.find(".registererror").text("First name, email and password are required.").show();
            return false;
        }

        $.ajax({
            url: "/api/v1/community/register",
            method: "POST",
            data: data,
            success: function (response) {
                if (response.token) {
                    Cookies.set('btvendortoken', response.token, { expires: 7 });
                }
                window.location.href = "/community";
            },
            error: function (xhr) {
                var msg = (xhr.responseJSON && xhr.responseJSON.error) || "There was a problem creating your account.";
                $form.find(".registererror").text(msg).show();
            }
        });
        return false;
    });
});
</script>
@endsection
