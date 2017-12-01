$(document).ready(function(){
    "use strict";

    $("#gallerygrid .item").on("click", function(){
        var mediaid = $(this).data('id');
        console.log(mediaid);
        $("#imagedisplay").fadeIn(300, function(){
            $.get("http://bridalteam.dev/api/v1/media/public/" + mediaid, function(res){
                console.log(res);
                $("#imagedisplay .imagecontainer .image img").attr('src', "/storage" + res.media.media.urlpath);
                $("#imagedisplay .imagecontainer .tags").empty();

                var keywords = res.media.media.keyword.split(",");
                keywords.forEach((function(val, index){
                    console.log(val);
                    $("#imagedisplay .imagecontainer .tags").append("<span><a>" + val + "</a></span>");
                }));
                $("#imagedisplay .imagecontainer").fadeIn(400);
            });
            
        });
    });

    $("#imagedisplay_close").on("click", function(){
        $("#imagedisplay").fadeOut(300, function(){
            $("#imagedisplay .imagecontainer").hide();
        });
    });

    var grid = $('#gallerygrid .grid').imagesLoaded(function(){
        grid.isotope({
            // options
            itemSelector: '.item',
            masonry: {
                columnWidth: 275
            }
        });
    });

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

