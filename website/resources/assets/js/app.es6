$(document).ready(function(){
    "use strict";

    $("#homepage #heroimage select").minimalect({
        placeholder: "Select a category to begin",
        searchable: false,
        onchange: function(value, text){            
            window.location.href = "/vendors/" + value;
        }
    });
    

    $("#mobilemenubtn").click(function(){
        if($("nav#mainmenu").hasClass('mobile')){
            $("nav#mainmenu").removeClass('mobile');
        }else{
            $("nav#mainmenu").addClass('mobile');
        }            
    });

    $("#loginSubmit").click(function(){
        var email = $("#vendorloginform").find("input[name=email]").val();
        var password = $("#vendorloginform").find("input[name=password]").val();

        var valid = true;

        if(email === ""){
            valid = false;
        }

        if(password === ""){
            valid = false;
        }

        if(valid){
            $("#vendorloginform .pageloading").show();
            $.ajax({
                url: "/api/v1/vendors/login",
                method: "POST",
                data: {
                    email: email,
                    password: password
                },
                success: function(response){	
                    Cookies.set('btvendortoken', response.token, { expires: 7 });
                    window.location.href = "/vendor/account";
                },
                error: function(){
                    alert("There was a problem logging in.");
                }
            });
        }
        return false;
    });
});

