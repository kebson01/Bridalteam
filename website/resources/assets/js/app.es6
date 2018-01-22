var grid = null;

$(document).ready(function(){
    "use strict";

    if($("#vendorprofile").length != 0){
        $("#vendorprofile #profile_details #profile_tabs > div").hide();
        $("#vendorprofile #profile_details #profile_tabs > div#tab_about").show();

        $("#vendorprofile #profile_details #profile_tabs > ul > li > a, #profile_details #profile_tabs > a").click(function(){        
            var tab = $(this).data("tab");
            console.log("Clicked on a tab");
            $("#profile_details #profile_tabs > div").hide();
            $("#profile_details #profile_tabs > div#" + tab).show();
        });

        $("#vendorprofile #profile_header_info .profile_contact_info a.vendorlink").click(function(){
            console.log("Show contact form modal");
            var btpmstoken = Cookies.get('btpmstoken');
            if(btpmstoken === undefined){
                btpmstoken = "";
            }
            $.ajax({
                url: '/api/v1/modals/vendormessageform/' + $("#vendorprofile input[name=vid]").val(),
                method: 'POST',
                data: JSON.stringify({btpmstoken: btpmstoken}),
                contentType: "application/json",                  
                success: function(data){                    

                    showModalDialog(data.ui, "Contact Vendor");
                    var registrationform = $("#modaldialog .vendorcontact.form").parsley();
                    $("#modaldialog .vendorcontact.form select[name=eventtype]").change(function(){
                        if($(this).val() == "Other"){
                            $("#modaldialog .vendorcontact.form input[name=othereventtype]").parents(".columns").show();
                        }else{
                            $("#modaldialog .vendorcontact.form input[name=othereventtype]").parents(".columns").hide();
                        }
                    });
                    $("#modaldialog .vendorcontact.form #btn_cancel").click(function(){                        
                        removeModalDialog();
                        return false;
                    });
                    $("#modaldialog .vendorcontact.form").submit(function(){
                        var form = $("#modaldialog .vendorcontact.form").serializeJSON();                        
                        $.ajax({
                            url: '/api/v1/vendors/sendvendormessage/' + $("#vendorprofile input[name=vid]").val(),
                            method: 'POST',
                            contentType: "application/json",
                            data: JSON.stringify(form),
                            success: function(result){
                                console.log(result);
                                if(result.status == "OK"){                                    
                                    removeModalDialog();
                                    alert("Your message has been sent to this vendor.");
                                }else{                                    
                                    removeModalDialog();
                                    alert("Error: " + result.message);
                                }
                            },
                            error: function(err){                                
                                console.error(err);
                            }
                        })
                        return false;
                    });
                }
            });            
        });
    }
    

    initGalleryGrid();

    if($("#gallerysearch").length != 0){
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
            getFilteredMedia();
        });
    
        $("#gallerycats, #gallerytheme").selectize({
            sortField: 'value'
        });
    
        $("#gallerycolor").selectize({
            options: colorsjson,
            valueField: "id",
            labelField: 'name',        
            render: {
                option: function(item, escape) {                
                    return '<div><span style="vertical-align:middle;margin-right:10px;display:inline-block;width: 25px;height:25px;background-color:' + escape(item.color) + ';"></span><span class="title">' + escape(item.name) + '</span></div>';
                }
            }
        });
    }

    $("#gallerycats, #gallerycolor, #gallerytheme").on('change', function(e){        
        getFilteredMedia();
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
    var category = $("#gallerycats").val();
    var keywords = $("#gallerykeywords").val();
    var theme = $("#gallerytheme").val();;
    var color = $("#gallerycolor").val();;;

    $('#gallerygrid .grid').css({opacity: 0});
    $.ajax({
        url: "/api/v1/media/public/filter",
        method: "POST",
        data: {
            category: category,
            keyword: keywords,
            theme: theme,
            color: color
        },
        success: function(response){            
            

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
            $.get("/api/v1/media/public/" + mediaid, function(res){
                console.log(res);
                $("#imagedisplay .imagecontainer .image a").removeAttr("href");
                $("#imagedisplay .imagecontainer .image a").removeAttr("target");
                $("#imagedisplay .imagecontainer .imageowner").empty();
                $("#imagedisplay .imagecontainer .imageowner").html("by<br /><a href='/vendor/" + res.media.vendorslug + "'>" + res.media.vendorname + "</a>");
                if(res.media.product_link != null){
                    $("#imagedisplay .imagecontainer .image a").attr("href", res.media.product_link);
                    $("#imagedisplay .imagecontainer .image a").attr("target", "_blank");
                    $("#imagedisplay .imagecontainer .image a").append("<span>Click to view product</span>");
                }
                $("#imagedisplay .imagecontainer .image img").attr('src', "/storage" + res.media.urlpath);
                $("#imagedisplay .imagecontainer .tags").empty();
                $("#imagedisplay .imagecontainer .details").empty();

                var keywords = res.media.keyword.split(",");
                keywords.forEach((function(val, index){
                    console.log(val);
                    $("#imagedisplay .imagecontainer .tags").append("<span><a>" + val + "</a></span>");
                }));

                if(res.media.color != 0){
                    $("#imagedisplay .imagecontainer .details").append("<span><a>COLOR: " + res.media.color + "</a></span>");
                }
                
                if(res.media.theme != 0){
                    $("#imagedisplay .imagecontainer .details").append("<span><a>THEME: " + res.media.theme + "</a></span>");
                }
                

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

function showModalDialog(html, title){
    var modalhtml = "<div id='modaldialogcontainer' class='dialog'><div id='modaldialog' class='dialog'><header><h1>" + title + "</h1></header>" + html + "</div></div>";
    $("#wrapper").append(modalhtml);
    $("body").addClass("noscroll");
    $("#modaldialogcontainer #modaldialog > nav a").click(function(){
        var tab = $(this).data("tab");
        $("#modaldialogcontainer #modaldialog > nav li").removeClass('active');
        $(this).parent().addClass('active');
        $("#modaldialogcontainer #modaldialog div.dialogcontent").hide();
        $("#modaldialogcontainer #modaldialog div.dialogcontent").removeClass('active');
        $("#modaldialogcontainer #modaldialog div.dialogcontent[data-tab='" + tab + "']").show();
        $("#modaldialogcontainer #modaldialog div.dialogcontent[data-tab='" + tab + "']").addClass('active');
    });
}

function removeModalDialog(){
    $("body").removeClass("noscroll");
    $("#modaldialogcontainer").remove();    
}

