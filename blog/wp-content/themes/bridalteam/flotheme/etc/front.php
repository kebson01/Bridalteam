<?php

/**
 * Remove HTML attributes from comments 
 */
add_filter( 'comment_text', 'wp_filter_nohtml_kses' );
add_filter( 'comment_text_rss', 'wp_filter_nohtml_kses' );
add_filter( 'comment_excerpt', 'wp_filter_nohtml_kses' );

/**
 * Remove junk from head
 */
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'index_rel_link');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'start_post_rel_link', 10, 0);
remove_action('wp_head', 'parent_post_rel_link', 10, 0);
remove_action('wp_head', 'adjacent_posts_rel_link', 10, 0);
remove_action('wp_head', 'feed_links_extra', 3 );

/**
 * This filter adds query for post search only.
 *
 * @param object $query
 * @return object
 */
function flo_exclude_search_pages($query) {
	if ($query->is_search) {
		$query->set('post_type', 'post');
	}

	return $query;
}
if( !is_admin() ) add_filter('pre_get_posts', 'flo_exclude_search_pages');

/**
 * Load needed options & translations into template.
 */
function flo_init_js_vars() {
	wp_localize_script(
		'flo_scripts',
		'flo',
		array(
			'template_dir'      => THEME_URL,
			'ajax_load_url'     => site_url('/wp-admin/admin-ajax.php'),
			'ajax_comments'     => (int) flo_get_option('ajax_comments'),
			'ajax_posts'        => (int) flo_get_option('ajax_posts'),
			'ajax_open_single'  => (int) flo_get_option('load_single_post'),
			'is_mobile'         => (int) is_mobile(),
			'login_url'			=> site_url('wp-login.php','login_post'),
			'home_url'			=> home_url(),
			'msg_thankyou'  => __('Thank you for your comment!', 'flotheme'),
		)
	);
}
add_action('wp_print_scripts', 'flo_init_js_vars');

/**
 * Enqueue Theme Styles
 */
function flo_enqueue_styles() {
	
	// add general css file
	wp_register_style( 'flotheme_general_css', THEME_URL . '/css/general.css', array(), FLOTHEME_THEME_VERSION, 'all');
	wp_enqueue_style('flotheme_general_css');
}
add_action( 'wp_enqueue_scripts', 'flo_enqueue_styles' );

/**
 * Enqueue Theme Scripts
 */
function flo_enqueue_scripts() {
	
	// load jquery from google cdn
	wp_deregister_script('jquery');
	//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
	//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
	wp_register_script('jquery', 'http://code.jquery.com/jquery-1.7.1.min.js');
	
	// add modernizr
	wp_register_script( 'flo_modernizr', THEME_URL . '/js/libs/modernizr-2.5.3.min.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
	
	if (FLOTHEME_MODE == 'production') {
		wp_register_script( 'flo_plugins', THEME_URL . '/js/plugins.min.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
		wp_register_script( 'flo_scripts', THEME_URL . '/js/scripts.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
	} else {
		wp_register_script( 'flo_plugins', THEME_URL . '/js/plugins.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
		wp_register_script( 'flo_scripts', THEME_URL . '/js/scripts.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );		
	}

	wp_register_script( 'jquery-colorbox', THEME_URL . '/js/libs/jquery.colorbox-min.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
	wp_register_script( 'jquery-infinite-scroll', THEME_URL . '/js/libs/jquery.infinitescroll.min.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
	wp_register_script( 'jquery-isotope', THEME_URL . '/js/libs/jquery.isotope.min.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
	wp_register_script( 'jquery-tooltipster', THEME_URL . '/js/libs/jquery.tooltipster.min.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );
	// wp_register_script( 'jquery-dropkick', THEME_URL . '/js/libs/jquery.dropkick.js', array( 'jquery' ), FLOTHEME_THEME_VERSION, false );

	wp_enqueue_script( 'jquery-colorbox' );
	wp_enqueue_script( 'jquery-infinite-scroll' );
	wp_enqueue_script( 'jquery-isotope' );

	wp_enqueue_script( 'jquery-tooltipster' );

	// wp_enqueue_script( 'jquery-dropkick' );

	wp_enqueue_script( 'jquery-ui-tabs' );
	
	wp_enqueue_script( 'jquery-form' );
	wp_enqueue_script( 'flo_modernizr' );
	wp_enqueue_script( 'flo_plugins' );
	wp_enqueue_script( 'flo_scripts' );
}
add_action( 'wp_enqueue_scripts', 'flo_enqueue_scripts');

/**
 * Add header information 
 */
function flo_head() {
	?>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<link rel="shortcut icon" href="<?php flo_favicon(); ?>" />
	<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
	<link rel="alternate" type="application/rss+xml" title="<?php bloginfo('name'); ?> RSS Feed" href="<?php flo_rss(); ?>" />
	<!--[if lt IE 9]>
		<script src="//html5shim.googlecode.com/svn/trunk/html5.js"></script>
	<![endif]-->
	<?php
}
add_action('wp_head', 'flo_head');

/**
 * Comment callback function 
 * @param object $comment
 * @param array $args
 * @param int $depth 
 */
function flotheme_comment($comment, $args, $depth) {
	$GLOBALS['comment'] = $comment; ?>
	<li <?php comment_class(); ?> data-comment-id="<?php echo $comment->comment_ID?>">
		<div id="comment-<?php comment_ID(); ?>">
			<header class="comment-author vcard cf">
				<?php comment_reply_link(array_merge($args, array('depth' => $depth, 'max_depth' => $args['max_depth']))); ?>
				<?php echo get_avatar($comment, $size = '32'); ?>
				<?php printf(__('<cite class="fn">%s</cite>', 'flotheme'), get_comment_author_link()); ?>
				<?php //edit_comment_link(__('(Edit)', 'flotheme'), '', ''); ?>
			</header>
			<?php if ($comment->comment_approved == '0') : ?>
			<p><?php _e('Your comment is awaiting moderation.', 'flotheme'); ?></p>
			<?php endif; ?>
			<section class="comment-body"><?php comment_text() ?></section>
			<time datetime="<?php echo comment_date('c'); ?>"><a href="<?php echo htmlspecialchars(get_comment_link($comment->comment_ID)); ?>"><?php printf(__('%1$s', 'flotheme'), get_comment_date(),  get_comment_time()); ?></a></time>
		</div>
<?php }

/**
 * Custom password form
 * @global object $post
 * @return string 
 */
function flotheme_password_form() {
	global $post;
	$label = 'pwbox-'.( empty( $post->ID ) ? rand() : $post->ID );
	$html = '<form class="protected-post-form" action="' . site_url('wp-login.php?action=postpass') . '" method="post">
	<p>' . __( "This post is password protected. To view it please enter your password below:", 'flotheme') . '</p>
	<p><label for="' . $label . '">' . __( "Password:", 'flotheme' ) . ' </label><input name="post_password" id="' . $label . '" type="password" size="20" /><input type="submit" name="Submit" value="' . esc_attr__( "Submit", 'flotheme' ) . '" /><input type="hidden" name="_wp_http_referer" value="' . get_permalink() . '" /></p>
	</form>
	';
	return $html;
}
add_filter( 'the_password_form', 'flotheme_password_form' );

/**
 * Add footer information
 * Social Services Init 
 */
function flo_footer() {
	?>
	<script type="text/javascript">
	(function() {
		var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
		po.src = 'https://apis.google.com/js/plusone.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
	})();
	</script>
	<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
	<div id="fb-root"></div>
	<script>(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {return;}
		js = d.createElement(s); js.id = id;
		js.src = "//connect.facebook.net/en_US/all.js#xfbml=1";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));</script>
	<script type="text/javascript" src="http://assets.pinterest.com/js/pinit.js"></script>
	<?php
}

add_action('wp_footer', 'flo_footer');

/**
 * Add Google Analytics Code
 */
function flo_google_analytics() {
	$analytics_id = trim(flo_get_option('ga'));
	
	if ($analytics_id) {
		echo "\n\t<script>\n";
		echo "\t\tvar _gaq=[['_setAccount','$analytics_id'],['_trackPageview'],['_trackPageLoadTime']];\n";
		echo "\t\t(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];\n";
		echo "\t\tg.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';\n";
		echo "\t\ts.parentNode.insertBefore(g,s)}(document,'script'));\n";
		echo "\t</script>\n";
	}
}
add_action('wp_footer', 'flo_google_analytics');

/**
 * Add Open Graph Tags to <head> 
 */
function flo_og_meta() {
	if (flo_get_option('og_enabled')) {
		
	$og_type='article';
	$og_locale = get_locale();
	
	$og_image = '';
	
	// single page
	if (is_singular()) {
		global $post;
		$og_title = esc_attr(strip_tags(stripslashes($post->post_title)));
		$og_url = get_permalink();
		if (trim($post->post_excerpt) != '') {
			$og_desc = trim($post->post_excerpt);
		} else {
			$og_desc = flo_truncate(strip_tags($post->post_content), 240, '...');
		}
		
		$og_image = flo_get_og_meta_image();
		
		if (is_front_page()) {
			$og_type = 'website';
		}
		
	} else {
		global $wp_query;
		
		$og_title = get_bloginfo('name');
		$og_url = site_url();
		$og_desc = get_bloginfo('description');
		
		if (is_front_page()) {
			$og_type = 'website';
			
		} elseif (is_category()) {
			$og_title = esc_attr(strip_tags(stripslashes(single_cat_title('', false))));
			$term = $wp_query->get_queried_object();
			$og_url = get_term_link($term, $term->taxonomy);
			$cat_desc = trim(esc_attr(strip_tags(stripslashes(category_description()))));
			if ($cat_desc) {
				$og_desc = $cat_desc;
			}
			
		} elseif(is_tag()) {
			$og_title = esc_attr(strip_tags(stripslashes(single_tag_title('', false))));
			$term = $wp_query->get_queried_object();
			$og_url = get_term_link($term, $term->taxonomy);
			$tag_desc = trim(esc_attr(strip_tags(stripslashes(tag_description()))));
			if (trim($tag_desc) != '') {
				$og_desc = $tag_desc;
			}
			
		} elseif (is_tax()) {	
			$og_title = esc_attr(strip_tags(stripslashes(single_term_title('', false))));
			$term = $wp_query->get_queried_object();
			$og_url = get_term_link($term, $term->taxonomy);
			
		} elseif(is_search()) {
			$og_title = esc_attr(strip_tags(stripslashes(__('Search for', 'flotheme') . ' "' . get_search_query() . '"')));
			$og_url = get_search_link();
			
		} elseif (is_author()) {
			$og_title = esc_attr(strip_tags(stripslashes(get_the_author_meta('display_name', get_query_var('author')))));
			$og_url = get_author_posts_url(get_query_var('author'), get_query_var('author_name'));
			
		} elseif (is_archive()) {
			if (is_post_type_archive()) {
				$og_title = esc_attr(strip_tags(stripslashes(post_type_archive_title('', false))));
				$og_url = get_post_type_archive_link(get_query_var('post_type'));
			} elseif (is_day()) {
				$og_title = esc_attr(strip_tags(stripslashes(get_query_var('day') . ' ' . single_month_title(' ', false) . ' ' . __('Archives', 'flotheme'))));
				$og_url = get_day_link(get_query_var('year'), get_query_var('monthnum'), get_query_var('day'));
			} elseif (is_month()) {
				$og_title = esc_attr(strip_tags(stripslashes(single_month_title(' ', false) . ' ' . __('Archives', 'flotheme'))));
				$og_url = get_month_link(get_query_var('year'), get_query_var('monthnum'));
			} elseif (is_year()) {
				$og_title = esc_attr(strip_tags(stripslashes(get_query_var('year') . ' ' . __('Archives', 'flotheme'))));
				$og_url = get_year_link(get_query_var('year'));
			}
			
		} else {
			// other situations
		}
	}
	
	if (!$og_desc) {
		$og_desc = $og_title;
	}
	?>
	
	<?php if (flo_get_option('fb_id')) : ?>
		<meta property="fb:app_id" content="<?php flo_option('fb_id')?>" />
	<?php endif; ?>
	<?php if ($og_image) : ?>
		<meta property="og:image" content="<?php echo $og_image ?>" />
	<?php endif; ?>
	<meta property="og:locale" content="<?php echo $og_locale ?> " />
	<meta property="og:site_name" content="<?php bloginfo('name') ?>" />
	<meta property="og:title" content="<?php echo $og_title ?>" />
	<meta property="og:url" content="<?php echo $og_url ?>" />	
	<meta property="og:type" content="<?php echo $og_type ?>" />
	<meta property="og:description" content="<?php echo $og_desc ?>" />
	<?php }
}
add_action('wp_head', 'flo_og_meta');

/**
 * Add OpenGraph attributes to html tag
 * @param type $output
 * @return string 
 */
function flo_add_opengraph_namespace($output) {
	if (flo_get_option('og_enabled')) {
		if (!stristr($output, 'xmlns:og')) {
			$output = $output . ' xmlns:og="http://ogp.me/ns#"';
		}
		if (!stristr($output, 'xmlns:fb')) {
			$output = $output . ' xmlns:fb="http://ogp.me/ns/fb#"';
		}
	}
	
	return $output;
}
add_filter('language_attributes', 'flo_add_opengraph_namespace',9999);

/**
 * Get image for Open Graph Meta 
 * 
 * @return string
 */
function flo_og_meta_image() {
	echo flo_get_og_meta_image();
}
function flo_get_og_meta_image() {
	global $post;
	$thumbdone=false;
	$og_image='';
	
	//Featured image
	if (function_exists('get_post_thumbnail_id')) {
		$attachment_id = get_post_thumbnail_id($post->ID);
		if ($attachment_id) {
			$og_image = wp_get_attachment_url($attachment_id, false);
			$thumbdone = true;
		}
	}
	
	//From post/page content
	if (!$thumbdone) {
		$image = flo_parse_first_image($post->post_content);
		if ($image) {
			preg_match('~src="([^"]+)"~si', $image, $matches);
			if (isset($matches[1])) {
				$image = $matches[1];
				$pos = strpos($image, site_url());
				if ($pos === false) {
					if (stristr($image, 'http://') || stristr($image, 'https://')) {
						$og_image = $image;
					} else {
						$og_image = site_url() . $image;
					}
				} else {
					$og_image = $image;
				}
				$thumbdone=true;
			}
		}
	}
	
	//From media gallery
	if (!$thumbdone) {
		$image = flo_get_first_attached_image($post->ID);
		if ($image) {
			$og_image = wp_get_attachment_url($image->ID, false);
			$thumbdone = true;
		}
	}
	
	return $og_image;
}

/**
 * Load Post AJAX Hook
 */
function flo_load_post() {
	global $withcomments;
	$query = new WP_Query(array(
		'post_type'     => 'post',
		'p'             => (int) $_POST['id'],
		'post_status'   => 'publish',
	));
	while($query->have_posts()){
		$query->the_post();
		flo_part( 'postcontent', 'single');
		flo_part( 'postactions', 'single');
		# force inserting comments in index
		$withcomments = 1;
		comments_template();
	};
	exit;
}
add_action('wp_ajax_flotheme_load_post', 'flo_load_post');
add_action('wp_ajax_nopriv_flotheme_load_post', 'flo_load_post');



/**
 * AJAXify comments
 * @global object $user
 * @param int $comment_ID
 * @param int $comment_status 
 */
function flo_post_comment_ajax($comment_ID, $comment_status) {
	global $user;
    if(!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
		$comment = get_comment($comment_ID);
		
        switch($comment_status){  
            case '0':  
                //notify moderator of unapproved comment  
                wp_notify_moderator($comment_ID);  
            case '1': //Approved comment  
                $post=&get_post($comment->comment_post_ID); //Notify post author of comment  
                if ( get_option('comments_notify') && $comment->comment_approved && $post->post_author != $comment->user_id )  
                    wp_notify_postauthor($comment_ID, $comment->comment_type);  
                break;  
            default:  
                echo json_encode(array(
					'error' => 1,
					'msg'	=> __('Something went wrong. Please refresh page and try again.', 'flotheme'),
				));exit;				
        }
		// save cookie for non-logged user.
		if ( !$user->ID ) {
			$comment_cookie_lifetime = apply_filters('comment_cookie_lifetime', 30000000);
			setcookie('comment_author_' . COOKIEHASH, $comment->comment_author, time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN);
			setcookie('comment_author_email_' . COOKIEHASH, $comment->comment_author_email, time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN);
			setcookie('comment_author_url_' . COOKIEHASH, esc_url($comment->comment_author_url), time() + $comment_cookie_lifetime, COOKIEPATH, COOKIE_DOMAIN);
		}
		
		// load a comment to variable
		ob_start();
		flotheme_comment($comment, array('max_depth' => 1), 1);
		$html = ob_get_clean();
		
		echo json_encode(array(
			'html'		=> $html,
			'success'	=> 1,
		));
		exit;
    }  
}
if( !is_admin() ) {
	add_action('comment_post', 'flo_post_comment_ajax', 20, 2);
}

/**
 * Change Wordpress Login Logo 
 */
function flo_login_logo() { ?>
    <style type="text/css">
        body.login div#login h1 a {
			background:#fff url(<?php echo get_template_directory_uri() ?>/images/admin-logo.png) 50% 50% no-repeat;
			height:100px;
			background-size: auto auto;
        }
		body.login div#login {
			background:#fff;
		}
		body.login {
			background:#fff
		}
		body.login #backtoblog {
			display:none;
		}
		body.login #nav {
			text-align:center;
		}
    </style>
<?php }
add_action( 'login_enqueue_scripts', 'flo_login_logo' );

/**
 * Change login logo URL
 * @return string 
 */
function flo_login_logo_url() {
    return home_url('/');
}
add_filter( 'login_headerurl', 'flo_login_logo_url' );

/**
 * Change login logo title
 * @return string 
 */
function flo_login_logo_url_title() {
    return get_bloginfo('name');
}
add_filter( 'login_headertitle', 'flo_login_logo_url_title' );
