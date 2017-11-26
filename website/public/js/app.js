$(document).ready(function () {
    "use strict";

    $("#mobilemenubtn").click(function () {
        if ($("nav#mainmenu").hasClass('mobile')) {
            $("nav#mainmenu").removeClass('mobile');
        } else {
            $("nav#mainmenu").addClass('mobile');
        }
    });
});