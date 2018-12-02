// add your custom scripts here
// as the page loads, call these scripts
jQuery(function($) {

    $(window).scroll(function(){
        if ($(this).scrollTop() > 100) {
            $('#scroll-to-top').fadeIn();
        } else {
            $('#scroll-to-top').fadeOut();
        }
    });  

     $('#scroll-to-top').click(function(){
        $("html, body").animate({ scrollTop: 0 }, 600);
        return false;    
     });
    

    $("#login-submit").click(function() {
        /*
        // turn loading screen on
        if ( $('#homelogin #user-login').val() == '' && $('#homelogin #user-pass').val() == '' ) {
            $('#home-login-ajax').text('Error. Login credentials incorrect!').fadeIn().delay(1500).fadeOut();
            return false;
        }
        $('#login-result').toggle();
            var input_data = $('#homelogin').serialize();
            $.ajax({
                type: "POST",
                url: '/login/user',
                data: input_data,
                success: function(msg) {
                // if login incorrect, wordpress will redirect user to its own login form. We scan for an error term.
                var reg1 = /errormessages/g;
                if (reg1.test(msg)) {
                    $('#home-login-ajax').text('Error. Login credentials incorrect!').fadeIn().delay(1500).fadeOut();
                    // console.log('login NO success');
                }
                else {
                    // login success. redirect users to some page.
                    $(location).attr('href', flo.home_url );
                }
            }
        });
        // turn loading screen off
        $('#login-result').toggle();
        // prevent actual submission of form
        return false;
        */
        return true;
    });


    $("#login-submit2").click(function() {
        /*
        if ( $('#loginform #user-login').val() == '' && $('#loginform #user-pass').val() == '' ) {
            $('#login-ajax').text('Error. Login credentials incorrect!').fadeIn().delay(1500).fadeOut();
            return false;
        }        
        // turn loading screen on
        $('#login-result').toggle();
            var input_data = $('#loginform').serialize();
            $.ajax({
                type: "POST",
                url: flo.login_url,
                data: input_data,
                success: function(msg) {
                // if login incorrect, wordpress will redirect user to its own login form. We scan for an error term.
                var reg1 = /login_error/g;
                if (reg1.test(msg)) {
                    $('#login-ajax').text('Error. Login credentials incorrect!').fadeIn().delay(1500).fadeOut();
                    // console.log('login NO success');
                }
                else {
                    // login success. redirect users to some page.
                    // $(location).attr('href', flo.home_url);
                    $(location).attr('href', $('#loginform input[name=redirect_to]').val());
                }
            }
        });
        // turn loading screen off
        $('#login-result').toggle();
        // prevent actual submission of form
        return false;*/
        return true;
    });

    $(document).ready(function(){
        // $('select').dropkick();

        $('#venue-submit .story').fitVids();

        $('.colorbox').colorbox({inline: true, width: "400px"});

        $('#login-button').colorbox({inline: true, width: "400px"});

        $('#lens-button').colorbox({inline: true, width: "400px"});

        $('#inspired-content-btn').colorbox({inline: true, width: "400px"});

        $(document).on("click", ".like-this", function(){
            var fn = $(this);

            if (fn.hasClass('login')) {
                $('#login-button').click();
                return false;
            }

            fn.addClass("loading");
            
            $('#ajax-response').load(flo.ajax_load_url, {
                'action':'flo_like_post',
                'pid':fn.data('post-id')
            }, function(response){
                if ( 'Success!' == response ) fn.removeClass("loading").addClass("active");
                if ( 'Success! Updated.' == response) fn.removeClass("loading").addClass("active").siblings('a').removeClass("active");
                if ( 'Like removed!' == response ) fn.removeClass("loading").removeClass("active");
                if ( 'Error, please login to use this function' == response ) $('#login-button').click();
            });         

            return false;
        });

        $(document).on("click", ".love-this", function(){
            var fn = $(this);

            if (fn.hasClass('login')) {
                $('#login-button').click();
                return false;
            }
            
            fn.addClass("loading");

            $('#ajax-response').load(flo.ajax_load_url, {
                'action':'flo_love_post',
                'pid':fn.data('post-id')
            }, function(response){
                if ( 'Success!' == response ) fn.removeClass("loading").addClass("active");
                if ( 'Success! Updated.' == response) fn.removeClass("loading").addClass("active").siblings('a').removeClass("active");
                if ( 'Like removed!' == response ) fn.removeClass("loading").removeClass("active");
                if ( 'Error, please login to use this function' == response ) $('#login-button').click();
            });         

            return false;
        });        
        // inspired not logged in
        $(document).on("click", ".inspired-login", function(){
            $('#login-button').click();

            return false;
        });        

        // Inspired section
        var inspired = $('#inspired-content');
        var inspired_btn = $('#inspired-content-btn');
        $(document).on("click", "a.inspired", function() {
        // $('.inspired').click(function(){
            var fn = $(this);

            inspired.html(
                '<input name="Title" placeholder="Enter title here..." class="title" />' + 
                '<img src="'+fn.data('src')+'" />' + 
                '<div class="selector">' + $('#wedfolio-category').clone().html() + '</div>' + 
                '<a class="orange button" data-src="' + fn.data('src') + '">ADD</a>'
            );

            inspired_btn.click();

            $('select', inspired).dropkick();

            return false;
        });

        inspired.on("click", ".button", function() {
            inspired.addClass('loading');

            $('#ajax-response').load(flo.ajax_load_url, {
                'action'            : 'flo_wedfolio_add',
                'wedfolio-category' : inspired.find('select :selected').val(),
                'title'             : inspired.find('input.title').val(),
                'src'               : $(this).data('src')
            }, function(response){
                inspired.removeClass("loading");
                inspired.html('<h3>Thank you!</h3><p>Image added to Wedfolio.</p>');
                window.setTimeout(function(){
                    $('#cboxClose').click(); 
                }, 1500);
            });          
        });     

        //wedfolio single
        $('.wedfolio').on('click','.open-single-wedfolio', function(){
            $(this).colorbox({
                // scrolling: false,
                width: '665px',
                maxHeight: '1000px',
                data: {ajax: true},
                onComplete: function(what){
                    var colorbox = $(this);
                    //load ajax comments function here
                    post = $('#single-wedfolio');

                    var init_comments = function(post) {
                        var respond = $('section.respond', post);
                        var respond_form = $('form', respond);
                        var respond_form_error = $('p.error', respond_form);
                        var respond_cancel = $('.cancel-comment-reply a', respond);
                        var comments = $('section.comments', post);

                        $('a.comment-reply-link', post).on('click', function(e){
                            e.preventDefault();
                            var comment = $(this).parents('li.comment');
                            comment.find('>div').append(respond);
                            respond_cancel.show();
                            respond.find('input[name=comment_post_ID]').val(post.data('post-id'));
                            respond.find('input[name=comment_parent]').val(comment.data('comment-id'));
                            respond.find('input:first').focus();
                        }).attr('onclick', '');
                        
                        respond_cancel.on('click', function(e){
                            e.preventDefault();
                            comments.after(respond);
                            respond.find('input[name=comment_post_ID]').val(post.data('post-id'));
                            respond.find('input[name=comment_parent]').val(0);
                            $(this).hide();
                        });
                        
                        respond_form.ajaxForm({
                            beforeSubmit:function(){
                                respond_form_error.text('').hide();
                            },
                            success: function(_data){
                                var data = $.parseJSON(_data);
                                if (data.error) {
                                    respond_form_error.html(data.msg).slideDown('fast');
                                    return;
                                }
                                var comment_parent_id = respond.find('input[name=comment_parent]').val();
                                var _comment = $(data.html);
                                var list;
                                _comment.hide();
                                
                                if (comment_parent_id == 0) {
                                    list = comments.find('ol');
                                    if (!list.length) {
                                        list = $('<ol class="commentlist"></ol>');
                                        comments.append(list);
                                    }
                                } else {
                                    list = $('#comment-' + comment_parent_id).parent().find('ul');
                                    if (!list.length) {
                                        list = $('<ul class="children"></ul>');
                                        $('#comment-' + comment_parent_id).parent().append(list);
                                    }
                                    respond_cancel.trigger('click');
                                }
                                list.append(_comment);
                                _comment.fadeIn('fast')
                                        .scrollTo();
                                respond.find('textarea').clearFields();

                                colorbox.resize();
                            },
                            error:function(response){
                                var error = response.responseText.match(/\<p\>(.*)<\/p\>/)[1];
                                if (typeof(error) == 'undefined') {
                                    error = 'Something went wrong. Please reload the page and try again.';
                                }
                                respond_form_error.html(error).slideDown('fast');
                            }
                        });
                    }

                    init_comments(post);

                }
            });
        });
    });

});

Modernizr.addTest('ipad', function () {
  return !!navigator.userAgent.match(/iPad/i);
});

Modernizr.addTest('iphone', function () {
  return !!navigator.userAgent.match(/iPhone/i);
});

Modernizr.addTest('ipod', function () {
  return !!navigator.userAgent.match(/iPod/i);
});

Modernizr.addTest('appleios', function () {
  return (Modernizr.ipad || Modernizr.ipod || Modernizr.iphone);
});

Modernizr.addTest('positionfixed', function () {
    var test    = document.createElement('div'),
        control = test.cloneNode(false),
        fake = false,
        root = document.body || (function () {
            fake = true;
            return document.documentElement.appendChild(document.createElement('body'));
        }());

    var oldCssText = root.style.cssText;
    root.style.cssText = 'padding:0;margin:0';
    test.style.cssText = 'position:fixed;top:42px'; 
    root.appendChild(test);
    root.appendChild(control);
    
    var ret = test.offsetTop !== control.offsetTop;

    root.removeChild(test);
    root.removeChild(control);
    root.style.cssText = oldCssText;
    
    if (fake) {
        document.documentElement.removeChild(root);
    }
    
    /* Uh-oh. iOS would return a false positive here.
     * If it's about to return true, we'll explicitly test for known iOS User Agent strings.
     * "UA Sniffing is bad practice" you say. Agreeable, but sadly this feature has made it to
     * Modernizr's list of undectables, so we're reduced to having to use this. */
    return ret && !Modernizr.appleios;
});


// Modernizr.load loading the right scripts only if you need them
Modernizr.load([
	{
		// Let's see if we need to load selectivizr
		test : Modernizr.borderradius,
		// Modernizr.load loads selectivizr and Respond.js for IE6-8
		nope : [flo.template_dir + '/js/libs/selectivizr.min.js', flo.template_dir + '/js/libs/respond.min.js']
	},{
		test: Modernizr.touch,
		yep:flo.template_dir + '/css/touch.css'
	}
]);

// reload pinterest script with ajax calls
function pin_load(){
    js = $('script[src*="assets.pinterest.com/js/pinit.js"]');
    js.remove();
	
	var s = document.createElement("script");
	s.type = "text/javascript";
	s.async = true;
	s.src = "http://assets.pinterest.com/js/pinit.js";
	var x = document.getElementsByTagName("script")[0];
	x.parentNode.insertBefore(s, x);
}

jQuery(function($) {
	var is_single = $('#post').length;
	var posts = $('article.post');
	var is_mobile = parseInt(flo.is_mobile);
	
	var slider_settings = {
		animation: "slide",
		slideshow: false,
		controlNav: false
	}
	
    $(document).ajaxComplete(function(){
        try{
			if (!posts.length) {
				return;
			}
            FB.XFBML.parse(); 
            gapi.plusone.go();
            twttr.widgets.load();
			// pin_load();
        }catch(ex){}
    });
	
    // open external links in new window
    $("a[rel$=external]").each(function(){
        $(this).attr('target', '_blank');
    });
	
	$.fn.init_posts = function() {
		var init_post = function(data) {
            // close other posts
            data.post.siblings('.open-post').find('a.toggle').trigger('click', {
                hide:true
            });
			
			var loading = data.post.find('span.loading');
			
			if (data.more.is(':empty')) {
				data.post.addClass('post-loading');
				loading.css('visibility', 'visible');
                data.more.load(flo.ajax_load_url, {
                    'action':'flotheme_load_post',
                    'id':data.post.data('post-id')
                }, function(){
                    loading.remove();
                    data.more.slideDown(400, function(){
                        data.post.addClass('open-post');
                        data.toggler.text('Close Post');
						$('.video', data.more).fitVids();
                        if (data.scroll) {
                            data.scroll.scrollTo('fast');
                        }
                    });
					init_comments(data.post);
                });
            } else {
                data.more.slideDown(400, function(){
                    data.post.addClass('open-post');
                    data.toggler.text('Close Post');
                    if (data.scroll) {
                        data.scroll.scrollTo('fast');
                    }
                });
            }
		}

		var load_post = function(e, _opts) {
			e.preventDefault();
            var data  = {
                toggler:$(this),
                scroll:false
            };
            var opts = $.extend({
                comments:false,
                hide:false,
                add_comment:false
            }, _opts);
            data.post = data.toggler.parents('article.post');
            data.more = data.post.find('.full');
			
            if (data.more.is(':visible')) {
                if (opts.hide == true) {
					// quick hide for multiple posts
                    data.more.hide();
                } else {
                    data.more.slideUp(400);
                }
                data.toggler.text('Open Post');
                data.post.removeClass('open-post');
            } else {
                if (typeof(e.originalEvent) != 'undefined' ) {
                    data.scroll = data.post;
                }
                init_post(data);
            }
		}
		
		var init_comments = function(post) {
			var respond = $('section.respond', post);
			var respond_form = $('form', respond);
			var respond_form_error = $('p.error', respond_form);
			var respond_cancel = $('.cancel-comment-reply a', respond);
			var comments = $('section.comments', post);
			
			$('a.comment-reply-link', post).on('click', function(e){
				e.preventDefault();
				var comment = $(this).parents('li.comment');
				comment.find('>div').append(respond);
				respond_cancel.show();
				respond.find('input[name=comment_post_ID]').val(post.data('post-id'));
				respond.find('input[name=comment_parent]').val(comment.data('comment-id'));
				respond.find('input:first').focus();
			}).attr('onclick', '');
			
			respond_cancel.on('click', function(e){
				e.preventDefault();
				comments.after(respond);
				respond.find('input[name=comment_post_ID]').val(post.data('post-id'));
				respond.find('input[name=comment_parent]').val(0);
				$(this).hide();
			});
			
			respond_form.ajaxForm({
				'beforeSubmit':function(){
					respond_form_error.text('').hide();
				},
				'success':function(_data){
					var data = $.parseJSON(_data);
					if (data.error) {
						respond_form_error.html(data.msg).slideDown('fast');
						return;
					}
					var comment_parent_id = respond.find('input[name=comment_parent]').val();
					var _comment = $(data.html);
					var list;
					_comment.hide();
					
					if (comment_parent_id == 0) {
						list = comments.find('ol');
						if (!list.length) {
							list = $('<ol class="commentlist"></ol>');
							comments.append(list);
						}
					} else {
						list = $('#comment-' + comment_parent_id).parent().find('ul');
						if (!list.length) {
							list = $('<ul class="children"></ul>');
							$('#comment-' + comment_parent_id).parent().append(list);
						}
						respond_cancel.trigger('click');
					}
					list.append(_comment);
					_comment.fadeIn('fast')
							.scrollTo();
					respond.find('textarea').clearFields();
				},
				'error':function(response){
					var error = response.responseText.match(/\<p\>(.*)<\/p\>/)[1];
					if (typeof(error) == 'undefined') {
						error = 'Something went wrong. Please reload the page and try again.';
					}
					respond_form_error.html(error).slideDown('fast');
				}
			});
		}
		$(this).each(function(){
			var post = $(this);

            // init lazyloader
            // post.find('.full').lazyloader('img', {
            //     duration: 500
            // });

			// init post galleries 
			$(window).load(function(){
				$('.preview .flexslider', post).flexslider(slider_settings);
			});
			// do not init ajax posts & comments for mobile
			if (!is_mobile) {
				// ajax posts enabled
                if (flo.ajax_posts) {
                    $('a.toggle', post).click(load_post);
					$('.video', post).fitVids();
					$('.preview figure a', post).click(function(e){
						e.preventDefault();
						$(this).parents('article.post').find('a.toggle').trigger('click');
					});
                }
			}
		});
		// init ajax comments on a single post if ajax comments are enabled
		if (is_single && parseInt(flo.ajax_comments)) {
			init_comments(posts);	
		}
		// open single post on page
		if (parseInt(flo.ajax_open_single) && !is_single && posts.length == 1) {
			posts.find('a.toggle').trigger('click');
		}
	}
	posts.init_posts();
	
	$.fn.init_gallery = function() {
		$(this).each(function(){
			var gallery = $(this);
			$(window).load(function(){
				$('.flexslider', gallery).flexslider(slider_settings);
			});
			
		})
	}
	$('#gallery').init_gallery();

    $.fn.init_archives = function()
    {
        $(this).each(function(){
            var archives = $(this);
            var year = $('#archives-active-year');
            var months = $('div.months div.year-months', archives);
            var arrows = $('a.up, a.down', archives);
            var activeMonth;
            var current, active;
            var animated = false;
			if (months.length == 1) {
				arrows.remove();
				activeMonth = months.filter(':first').addClass('year-active').show();
				year.text(activeMonth.attr('id').replace(/[^0-9]*/, ''));
				return;
			}
            arrows.click(function(e){
                e.preventDefault();
                if (animated) {
                    return;
                }
                var fn = $(this);
                animated = true;
                arrows.css('visibility', 'visible');
                var current = months.filter('.year-active');
                if (fn.hasClass('up')) {
                    active = current.prev();
                    if (!active.length) {
                        active = months.filter(':last');
                    }
                } else {
                    active = current.next();
                    if (!active.length) {
                        active = months.filter(':first');
                    }
                }
                current.removeClass('year-active').fadeOut(150, function(){
                    active.addClass('year-active').fadeIn(150, function(){
                        animated = false;
                    });
                    year.text(active.attr('id').replace(/[^0-9]*/, ''));

                    if (fn.hasClass('up')) {
                        if (!active.prev().length) {
                            arrows.filter('.up').css('visibility', 'hidden');
                        }
                    } else {
                        if (!active.next().length) {
                            arrows.filter('.down').css('visibility', 'hidden');
                        }
                    }
                });
            });
            activeMonth = months.filter(':first').addClass('year-active').show();
            year.text(activeMonth.attr('id').replace(/[^0-9]*/, ''));
            arrows.filter('.up').css('visibility', 'hidden');
        });
    }
    $('#archives .flo-archives').init_archives();

	
	$(window).load(function(){
		$('#homepage > .flexslider').flexslider({
            animation: "fade",
            slideshow: true,
            slideshowSpeed: 3500,
            controlNav: false,
            video: true            
        });
	});
	
});

// HTML5 Fallbacks for older browsers
jQuery(function($) {
    // check placeholder browser support
    if (!Modernizr.input.placeholder) {
        // set placeholder values
        $(this).find('[placeholder]').each(function() {
            $(this).val( $(this).attr('placeholder') );
        });
 
        // focus and blur of placeholders
        $('[placeholder]').focus(function() {
            if ($(this).val() == $(this).attr('placeholder')) {
                $(this).val('');
                $(this).removeClass('placeholder');
            }
        }).blur(function() {
            if ($(this).val() == '' || $(this).val() == $(this).attr('placeholder')) {
                $(this).val($(this).attr('placeholder'));
                $(this).addClass('placeholder');
            }
        });
 
        // remove placeholders on submit
        $('[placeholder]').closest('form').submit(function() {
            $(this).find('[placeholder]').each(function() {
                if ($(this).val() == $(this).attr('placeholder')) {
                    $(this).val('');
                }
            });
        });
    }
});