<?php
/****************************************************************
 * DO NOT DELETE
 ****************************************************************/
global $current_user;
wp_get_current_user();
//$current_user = wp_get_current_user();
// define(CURRENT_USER, $user);

if ( STYLESHEETPATH == TEMPLATEPATH ) {
	define('FLOTHEME_PATH', TEMPLATEPATH . '/flotheme');
	define('FLOTHEME_URL', get_bloginfo('template_directory') . '/flotheme');
} else {
	
	define('FLOTHEME_PATH', STYLESHEETPATH . '/flotheme');
	define('FLOTHEME_URL', get_bloginfo('stylesheet_directory') . '/flotheme');
}

require_once FLOTHEME_PATH . '/init.php';

/****************************************************************
 * You can add your functions here.
 * 
 * BE CAREFULL! Functions will dissapear after update.
 * If you want to add custom functions you should do manual
 * updates only.
 ****************************************************************/

function flotheme_show_post_cover($pid,$size = 'post-thumbnail') {

	if (has_post_thumbnail($pid)) {
		$img = get_the_post_thumbnail($pid,$size);
	} else {
		$img = flo_get_first_attached_image($pid,$size);
		if ($img) {
			$img = wp_get_attachment_image($img->ID, $size);
		} else {
			$content_post = get_post($pid);
			$img = flo_parse_first_image($content_post->post_content);
		}
	}

	return $img;
}


function flotheme_get_also_like($by='tag') {	

	$orig_post = $post;
	global $post;
	$tags = wp_get_post_tags($post->ID);
	if ($tags) {
		$tag_ids = array();
		foreach($tags as $individual_tag) $tag_ids[] = $individual_tag->term_id;
		$args=array(
			'tag__in' => $tag_ids,
			'post__not_in' => array($post->ID),
			'orderby' => 'rand',
			'posts_per_page' => 3, // Number of related posts that will be shown.
			'caller_get_posts' => 1,
			'ignore_sticky_posts' => 1
		);
	}

	$my_query = new wp_query( $args );
	if( $my_query->have_posts() ) : 
	?>
		<div class="related-posts">
			<h3>You might also like:</h3>
			<ul>
				<?php 
					while( $my_query->have_posts() ) :
					$my_query->the_post();
				?>
				<li>
					<a href="<?php the_permalink()?>" rel="bookmark" title="<?php the_title(); ?>">
					<div class="thumb">
					<?php 
					if (has_post_thumbnail()) :
						$img = get_the_post_thumbnail();
					else:
						$img = flo_parse_first_image();
						if ($img == '') $img = '<img src="'.get_bloginfo('template_url').'/images/nofoto.png" />';
					endif; 
					?>		
					<?php echo $img; ?>
					</div>
					<h3><?php the_title(); ?></h3>
					</a>
				</li>
				<?php endwhile; ?>
			</ul>
		</div>
	<?php 
	endif;
	
	$post = $orig_post;
	wp_reset_query(); 
}

function flo_login_form($type='') {
	echo flo_get_login_form($type);
}

function flo_get_login_form($type='popup') {
	$formhtml = '';
	
	if($type == 'popup'):
		$formid = 'loginform';
		$formhtml .= "<form name='" . $formid . "' id='" . $formid . "' action='/login/user' accept-charset='UTF-8' method='post'>";
		$formhtml .= "<h2>Login</h2>";
		$formhtml .= '<p class="login-username"><label for="user-login"></label><input type="text" name="email" id="user-login" placeholder="email" class="input" value="" size="20"></p>';
		$formhtml .= '<p class="login-password"><label for="user-pass"></label><input type="password" name="password" id="user-pass" placeholder="password" class="input" value="" size="20"></p>';
		$formhtml .= '<p class="login-submit"><input type="submit" name="wp-submit" id="login-submit2" class="button-primary" value="Log In"></p>';
		$formhtml .= '<div class="bottom"><a href="/login/password" class="forgot">Forgot password ?</a><a href="/login/register" class="register">REGISTER</a></div>';
		$formhtml .= '<div id="login-ajax"></div>';
		$formhtml .= '<input type="hidden" name="redirect_to" value="' .site_url( $_SERVER['REQUEST_URI'] ) .'home" />';
		$formhtml .= '</form>';
	else:
		$formid = 'homelogin';
		$formhtml .= "<form name='" . $formid . "' id='" . $formid . "' action='/login/user' accept-charset='UTF-8' method='post'>";
		$formhtml .= '<p class="login-username"><label for="email"></label><input type="text" name="email" id="email" placeholder="email" class="input" value="" size="20"></p>';
		$formhtml .= '<p class="login-password"><label for="password"></label><input type="password" name="password" id="password" placeholder="password" class="input" value="" size="20"></p>';
		$formhtml .= '<p class="login-submit"><input type="submit" name="wp-submit" id="login-submit" class="button-primary" value="Log In"><a href="/login/register" class="register">REGISTER</a></p>';
		$formhtml .= '<a href="/login/password" class="forgot">Forgot your password ?</a><div id="home-login-ajax"></div>';
		$formhtml .= '<input type="hidden" name="redirect_to" value="' .site_url( $_SERVER['REQUEST_URI'] ) .'home" />';
		$formhtml .= '</form>';
	endif;

	return $formhtml;

}


/*function flo_get_login_form($type='popup') {
	$redirect =  $_SERVER["HTTP_HOST"] . $_SERVER["REQUEST_URI"];

	$largs = array(
		'echo'				=> false,
		'remember' 			=> false, 
		// 'redirect' 		=> site_url(),
		// 	var_dump( $_SERVER["HTTP_HOST"] , $_SERVER["REQUEST_URI"]); die 
		// 'redirect'			=> $redirect,
		// 'redirect' 			=> site_url( $_SERVER['REQUEST_URI'] ),
		// 'redirect'			=> 'http://flosites.com',
		'redirect' 			=> site_url( $_SERVER['REQUEST_URI'] ), 
		'label_username'	=> '',
		'label_password'	=> '',
		'id_username' 		=> 'user-login',
        'id_password' 		=> 'user-pass',
		'id_submit' 		=> 'login-submit',						        
	);

	if ( $type == 'popup' ) :

		$lform = wp_login_form($largs); 
		
		$_from = array( 
			'<p class="login-username">',
			'id="user-login"', 
			'id="user-pass"',
			'id="login-submit"',
			'</form>',
		);
		$_to   = array( 
			'<h2>Login</h2><p class="login-username">',
			'id="user-login" placeholder="Username"', 
			'id="user-pass" placeholder="Password"', 
			'id="login-submit2"',
			'<div class="bottom"><a href="'.site_url('/').'/wp-login.php?action=lostpassword" class="forgot">Forgot password ?</a>'.
			'<a href="'.site_url('/').'/wp-login.php?action=register" class="register">REGISTER</a></div><div id="login-ajax"></div></form>',
		);
		
		return str_replace($_from, $_to, $lform);
	else:
		$largs['form_id'] = 'homelogin';

		$lform = wp_login_form($largs); 
		
		$_from = array( 
			'id="user-login"', 
			'id="user-pass"',
			'value="Log In" />',
			'</form>',
		);
		$_to   = array( 
			'id="user-login" placeholder="Username"', 
			'id="user-pass" placeholder="Password"', 
			'value="Log In" />' . 
			'<a href="'.site_url('/').'/wp-login.php?action=register" class="register">REGISTER</a>',
			'<a href="'.site_url('/').'/wp-login.php?action=lostpassword" class="forgot">Forgot your password ?</a><div id="home-login-ajax"></div></form>',
		);
		
		return str_replace($_from, $_to, $lform);
	endif;
}*/

function flo_custom_posts_per_page($query)
{
	if ( 
		( isset($query->query_vars['gallery-category']) && $query->query_vars['gallery-category'] ) ||
		( isset($query->query_vars['gallery-location']) && $query->query_vars['gallery-location'] ) ||
		( isset($query->query_vars['gallery-colors']) && $query->query_vars['gallery-colors'] ) 
		) {
		$query->set('post_type', array('gallery'));
	}

	if ( $query->is_tax('wedfolio-category') ) {
		$query->set('post_type', array('wedfolio'));
	}
	if ( $query->is_tax('vendor-category') ) {
		$query->set('post_type', array('vendor'));
	}

	if (isset($query->query_vars['post_type'])) {
	    switch ($query->query_vars['post_type']) {
	        case 'event':
	        	if (!$query->query_vars['posts_per_page']) {
	        		$query->query_vars['posts_per_page'] = 3;
	        	}
	            break;
	        case 'venue':
	        	if (!$query->query_vars['posts_per_page']) {
	        		$query->query_vars['posts_per_page'] = 20;
	        	}
	            break;
	        default:
	            break;
	    }
	}

	// MyFolio filter by author
	if (isset($_REQUEST['my']) && is_user_logged_in() && is_archive('wedfolio') && $query->query_vars['post_type'] == 'wedfolio' ) {
		global $current_user;
		$query->query_vars['author'] =  $current_user->ID;
	}

	// vendor-category filter by location
	$vendor_location = (int) $_REQUEST['vc'];
	if ($query->is_tax('vendor-category') && $vendor_location > 0 ) {
		$location = get_term_by( 'ID', $vendor_location, 'vendor-location'); 
		$query->query_vars['vendor-location'] = $location->slug;
	}

	// wedfolio filter 
	if ( ( ( is_archive('wedfolio') && $query->query_vars['post_type'] == 'wedfolio' ) || ( $query->is_tax('wedfolio-category') ) ) && !isset($_REQUEST['my']) ) {
		$query->query_vars['meta_key'] = 'flo_wedfolio_featured';
		$query->query_vars['meta_value'] = 'on';
	}	

	// search filter
    if ($query->is_search && !is_admin() ) {
        $query->set('post_type',array('post','wedfolio'));
    }	

    return $query;
}
if(!is_admin()) {
    add_filter('pre_get_posts', 'flo_custom_posts_per_page');
}

function flo_hide_admin_bar($content) {
	return (current_user_can('administrator')) ? $content : false;
}
add_filter( 'show_admin_bar' , 'flo_hide_admin_bar');

function flo_no_user_dashboard() {
	if (defined('DOING_AJAX') && DOING_AJAX) {
		return;
	}
	if (!current_user_can('edit_posts')) {
		if (current_user_can('user')) {
			wp_redirect(site_url('wedfolio'));
		} else {
			wp_redirect(home_url());
		}
		exit;
	}
}
// add_action('admin_init', 'flo_no_user_dashboard');

function give_user_edit() {
	if(current_user_can('manage_options')) {
		$role = get_role('administrator');
		$role->add_cap("edit_venue");
		$role->add_cap("edit_venues");
		$role->add_cap("edit_others_venues");
		$role->add_cap("publish_venues");
		$role->add_cap("read_venues");
		$role->add_cap("read_private_venues");
		$role->add_cap("delete_venues");
	}
}
// add_action('admin_init', 'give_user_edit', 10, 0);


function flo_wrap_images_credits($content = null)
{
    if (!$content) {
        $content = get_the_content();
    }
	
	preg_match_all("/(<img[^>]+>)/sim", $content, $matches);
	
	$imgs=$matches[1];
	
	foreach($imgs as $k=>$img)
	{
		preg_match('~(src="([^"]+)")~simU', $img, $src);
		preg_match('~(title="([^"]+)")~simU', $img, $title);
		preg_match('~(class="([^"]+)")~simU', $img, $class);
		$img_md5 = md5($src[2]);
		$replace = '<div class="image '.$class[2].'" id="'.$img_md5.'"><img';
		if ($title[2]!='') { 			
			$credits = ''.$title[2];
		}
		if (is_user_logged_in()) { 
			$inspired = '<a href="#" class="inspired" data-src="'.$src[2].'">Inspired</a>';
		} else {
			$inspired = '<a href="#" class="inspired-login" data-src="'.$src[2].'">Inspired</a>';
		}
		if ($credits || $inspired) $bottom_info = '<span class="credits">'.$credits.$inspired.'</span>';
		$after = '>'.$bottom_info.'</div>';
		$res=str_replace(array('>','<img'),array($after,$replace),$img);
		
		$content=str_replace($img,$res,$content);
	}
	
	return $content;
}

function flo_vendor_get_description($vid=0) { 
	if ($vid == 0) $vid = get_the_ID();

	flo_meta();

	return $description;
}

// Save the review rating
add_action( 'comment_post', 'flo_save_review_meta_data' );
function flo_save_review_meta_data($comment_id) {
	if (isset( $_POST['rating_qos']) && $_POST['rating_qos'] != '') {

		$rating['qos'] 			= (int) $_POST['rating_qos'];
		$rating['response'] 	= (int) $_POST['rating_response'];
		$rating['pro']			= (int) $_POST['rating_pro'];
		$rating['value'] 		= (int) $_POST['rating_value'];
		$rating['flex'] 		= (int) $_POST['rating_flex'];
		$event_date 			= wp_filter_nohtml_kses( $_POST['event_date'] );
		$event_type 			= wp_filter_nohtml_kses( $_POST['event_type'] );
		$contact_person			= wp_filter_nohtml_kses( $_POST['contact_person'] );

		foreach ($rating as $key => $value) {
			if ($value > 5 || $value < 1) {
				$rating[$key] = 5;
			}
			add_comment_meta($comment_id, 'rating_'.$key, $rating[$key]);
		}

		add_comment_meta($comment_id, 'event_date', $event_date	);
		add_comment_meta($comment_id, 'event_type', $event_type	);
		add_comment_meta($comment_id, 'contact_person', $contact_person	);
	}
}


// Add an edit option to comment editing screen
add_action( 'add_meta_boxes_comment', 'flo_extend_comment_add_meta_box' );
function flo_extend_comment_add_meta_box() {
    add_meta_box( 'title', __( 'Review fields' ), 'flo_extend_comment_meta_box', 'comment', 'normal', 'high' );
}

function flo_extend_comment_meta_box ( $comment ) {
    $rating['qos'] 			= get_comment_meta( $comment->comment_ID, 'rating_qos', true );
	$rating['response'] 	= get_comment_meta( $comment->comment_ID, 'rating_response', true );
	$rating['pro']			= get_comment_meta( $comment->comment_ID, 'rating_pro', true );
	$rating['value'] 		= get_comment_meta( $comment->comment_ID, 'rating_value', true );
	$rating['flex'] 		= get_comment_meta( $comment->comment_ID, 'rating_flex', true );
	$event_date 			= get_comment_meta( $comment->comment_ID, 'event_date', true );
	$event_type 			= get_comment_meta( $comment->comment_ID, 'event_type', true );
	$contact_person			= get_comment_meta( $comment->comment_ID, 'contact_person', true ); 

    wp_nonce_field( 'extend_comment_update', 'extend_comment_update', false );
    ?>
    <p>
        <label for="event_type"><?php _e( 'Event Type: ' ); ?></label>
		<input type="text" name="event_type" id="event_type" value="<?php echo $event_type; ?>" />
	</p>
    <p>
        <label for="event_date"><?php _e( 'Event Date: ' ); ?></label>
		<input type="text" name="event_date" id="event_date" value="<?php echo $event_date; ?>" />
	</p>	
	<p>
        <label for="contact_person"><?php _e( 'Contact Person: ' ); ?></label>
		<input type="text" name="contact_person" id="contact_person" value="<?php echo $contact_person; ?>" />
    </p>    

    <p>
        <label for="rating"><?php _e( 'Quality Of Service: ' ); ?></label>
			<span class="commentratingbox">
			<?php for( $i=1; $i <= 5; $i++ ) {
				echo '<span class="commentrating"><input type="radio" name="rating_qos" id="rating_qos" value="'. $i .'"';
				if ( $rating['qos'] == $i ) echo ' checked="checked"';
				echo ' />'. $i .' </span>';
				}
			?>
			</span>
    </p>
    <p>
        <label for="rating"><?php _e( 'Responsiveness: ' ); ?></label>
			<span class="commentratingbox">
			<?php for( $i=1; $i <= 5; $i++ ) {
				echo '<span class="commentrating"><input type="radio" name="rating_response" id="rating_response" value="'. $i .'"';
				if ( $rating['response'] == $i ) echo ' checked="checked"';
				echo ' />'. $i .' </span>';
				}
			?>
			</span>
    </p>   
    <p>
        <label for="rating"><?php _e( 'Professionalism: ' ); ?></label>
			<span class="commentratingbox">
			<?php for( $i=1; $i <= 5; $i++ ) {
				echo '<span class="commentrating"><input type="radio" name="rating_pro" id="rating_pro" value="'. $i .'"';
				if ( $rating['pro'] == $i ) echo ' checked="checked"';
				echo ' />'. $i .' </span>';
				}
			?>
			</span>
    </p>   
    <p>
        <label for="rating"><?php _e( 'Value of Cost: ' ); ?></label>
			<span class="commentratingbox">
			<?php for( $i=1; $i <= 5; $i++ ) {
				echo '<span class="commentrating"><input type="radio" name="rating_value" id="rating_value" value="'. $i .'"';
				if ( $rating['value'] == $i ) echo ' checked="checked"';
				echo ' />'. $i .' </span>';
				}
			?>
			</span>
    </p>     
    <p>
        <label for="rating"><?php _e( 'Flexibility: ' ); ?></label>
			<span class="commentratingbox">
			<?php for( $i=1; $i <= 5; $i++ ) {
				echo '<span class="commentrating"><input type="radio" name="rating_flex" id="rating_flex" value="'. $i .'"';
				if ( $rating['flex'] == $i ) echo ' checked="checked"';
				echo ' />'. $i .' </span>';
				}
			?>
			</span>
    </p>           
    <?php
}

// Update comment meta data from comment editing screen
add_action( 'edit_comment', 'flo_extend_comment_edit_metafields' );
function flo_extend_comment_edit_metafields( $comment_id ) {
    if( ! isset( $_POST['extend_comment_update'] ) || ! wp_verify_nonce( $_POST['extend_comment_update'], 'extend_comment_update' ) ) return;

	if ( ( isset( $_POST['rating_qos'] ) ) && ( $_POST['rating_qos'] != '') ):
		$rating['qos'] 			= (int) $_POST['rating_qos'];
		$rating['response'] 	= (int) $_POST['rating_response'];
		$rating['pro']			= (int) $_POST['rating_pro'];
		$rating['value'] 		= (int) $_POST['rating_value'];
		$rating['flex'] 		= (int) $_POST['rating_flex'];

		foreach ($rating as $key => $value) {
			update_comment_meta( $comment_id, 'rating_'.$key, $value );			
		}
	else :
		// delete_comment_meta( $comment_id, 'rating');
	endif;

}

// Add the filter to check whether the comment meta data has been filled
// add_filter( 'preprocess_comment', 'flo_verify_comment_meta_data' );
function flo_verify_comment_meta_data( $commentdata ) {
	global $post;
	if ( ! isset( $_POST['rating'] ) && get_post_type($post->ID) == 'venue' )
	wp_die( __( 'Error: You did not add a rating. Hit the Back button on your Web browser and resubmit your comment with a rating.' ) );
	return $commentdata;
}

/**
 * Review callback function 
 * @param object $comment
 * @param array $args
 * @param int $depth 
 */
function flotheme_review($comment, $args, $depth) {
	$GLOBALS['comment'] = $comment; 
	$event_date 			= get_comment_meta( $comment->comment_ID, 'event_date', true );
	$event_type 			= get_comment_meta( $comment->comment_ID, 'event_type', true );
	$contact_person			= get_comment_meta( $comment->comment_ID, 'contact_person', true ); 
	?>
	<li <?php comment_class(); ?> data-comment-id="<?php echo $comment->comment_ID?>">
		<div id="comment-<?php comment_ID(); ?>">
			<header class="comment-author vcard cf">
				<?php printf(__('<cite class="fn">%s</cite>', 'flotheme'), get_comment_author_link()); ?>				
				<span>| <?php echo $event_type; ?></span>
				<time datetime="<?php echo comment_date('c'); ?>"><a href="<?php echo htmlspecialchars(get_comment_link($comment->comment_ID)); ?>"><?php printf(__('%1$s', 'flotheme'), get_comment_date(),  get_comment_time()); ?></a></time>
			</header>
			<div class="stars <?php echo flo_get_review_stars($comment); ?>"><span></span></div>
			<?php if ($comment->comment_approved == '0') : ?>
			<p><?php _e('Your review is awaiting moderation.', 'flotheme'); ?></p>
			<?php endif; ?>
			<section class="comment-body"><?php comment_text() ?></section>			
		</div>
<?php }

// function flo_get_total_marks()

function flo_get_review_stars($comment) {
	if (!$comment->comment_post_ID) return 'star0';

	$prefix = 'star';

	$rating = flo_get_review_marks($comment);

	return flo_draw_stars($rating['total']);

	return 'star'.floor($rating['total']).ceil($rating['half']);
}

function flo_get_review_marks($comment) {
	if (!$comment->comment_post_ID) return false;

    $rating['qos'] 			= (int) get_comment_meta( $comment->comment_ID, 'rating_qos', true );
	$rating['response'] 	= (int) get_comment_meta( $comment->comment_ID, 'rating_response', true );
	$rating['pro']			= (int) get_comment_meta( $comment->comment_ID, 'rating_pro', true );
	$rating['value'] 		= (int) get_comment_meta( $comment->comment_ID, 'rating_value', true );
	$rating['flex'] 		= (int) get_comment_meta( $comment->comment_ID, 'rating_flex', true );	

	$rating['total']		= array_sum($rating)/5;
	// $rating['half']			= $rating['total'] - floor($rating['total']);

	return $rating;
}

function flo_get_total_marks($comments) {

	$total['qos'] 		= array();
	$total['response'] 	= array();
	$total['pro']		= array();
	$total['value'] 	= array();
	$total['flex'] 		= array();
	$result				= array();

	if (count($comments)) {

		foreach ($comments as $c) {
			$rating = flo_get_review_marks($c);

			$total['qos'][] 		= $rating['qos'];
			$total['response'][]	= $rating['response'];
			$total['pro'][]			= $rating['pro'];
			$total['value'][]	 	= $rating['value'];
			$total['flex'][] 		= $rating['flex'];		
		}


		$result['qos']		= array_sum($total['qos'])/count($comments); $result['qos'] = round($result['qos'],1);
		$result['response'] = array_sum($total['response'])/count($comments); $result['response'] = round($result['response'],1);
		$result['pro']		= array_sum($total['pro'])/count($comments); $result['pro'] = round($result['pro'],1);
		$result['value']	= array_sum($total['value'])/count($comments); $result['value'] = round($result['value'],1);
		$result['flex']		= array_sum($total['flex'])/count($comments); $result['flex'] = round($result['flex'],1);
	}


	return $result;

}

function flo_draw_stars($mark) { 
	$total = floor($mark);
	$half = round($mark - floor($mark));
	return 'star'.$total.$half;
}

/**
 * Display first taxonomy link
 */
function flo_first_taxonomy($id=0,$taxonomy='vendor-category') {
	if ($id == 0) $id = get_the_ID();

    $term = flo_get_first_taxonomy($id, $taxonomy);
	if (!$term) {
		echo '';
		return;
	}
    echo '<a href="' . get_term_link($term, $taxonomy) . '">' . $term->name . '</a>';
}
/**
 * Parse first post taxonomy
 */
function flo_get_first_taxonomy($id=0,$taxonomy='vendor-category') {
	if($id==0) $id = get_the_ID();
    $terms = get_the_terms($id, $taxonomy);
    
    return $terms ? reset($terms) : false;
}

function flo_is_fresh() { 
	$fresh_hours = 48;

	$fresh = ( ( current_time('timestamp') - get_the_date('U') ) / 60 / 60 ) < $fresh_hours ? true : false;

	return $fresh;
}