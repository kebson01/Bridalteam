var grid = null;

$(document).ready(function(){
    "use strict";

    initGalleryGrid();

    $("#gallerykeywords").selectize({
        delimited: ',',
        persist: false,
        create: function(input){
            return {
                value: input,
                text: input
            }
        }
    });

    $("#gallerykeywords").on('change', function(e){        
        getFilteredMedia($("#gallerycats").val(), e.target.value);
    })

    $("#gallerycats").selectize({
        sortField: 'value'
    });

    $("#gallerycats").on('change', function(e){
        console.log(e.target.value);
        getFilteredMedia(e.target.value, $("#gallerykeywords").val());
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

function getFilteredMedia(category, keywords){
    $.ajax({
        url: "/api/v1/media/public/filter",
        method: "POST",
        data: {
            category: category,
            keyword: keywords
        },
        success: function(response){            
            $('#gallerygrid .grid').css({opacity: 0});

            var fullhtml = "";
            response.media.forEach(function(media, index){
                var html = '<div class="item" data-id="' + media.id + '"><div class="item-content">';
                html += '<div class="image"><img src="/storage' + media.thumbnailpath + '" /></div>';
                html += '<div class="tags">';
                var mediakeywords = media.keyword.split(",");
                mediakeywords.forEach(function(keyword){
                    html += '<span><a>' + keyword + '</a></span>';
                });
                html += '</div>';
                html += "</div></div>";

                fullhtml += html;
            });
            $("#gallerygrid .grid").empty();
            grid.isotope('destroy')

            $("#gallerygrid .grid").append(fullhtml);
            initGalleryGrid();
        }
    })
}

function initGalleryGrid(){
    $("#gallerygrid .item").on("click", function(){
        var mediaid = $(this).data('id');
        console.log(mediaid);
        $("#imagedisplay").fadeIn(300, function(){
            $.get("http://bridalteam.dev/api/v1/media/public/" + mediaid, function(res){
                console.log(res);
                $("#imagedisplay .imagecontainer .image img").attr('src', "/storage" + res.media.urlpath);
                $("#imagedisplay .imagecontainer .tags").empty();

                var keywords = res.media.keyword.split(",");
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

    $('#gallerygrid .grid').css({opacity: 0});

    grid = $('#gallerygrid .grid').imagesLoaded(function(){
        grid.isotope({
            // options
            itemSelector: '.item',
            masonry: {
                columnWidth: 275
            }
        });

        $('#gallerygrid .grid').css({opacity: 1});

    });
}

