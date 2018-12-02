<?php
/**
 Plugin Name: Mass delete tags
 Plugin URI: http://www.mijnpress.nl
 Description: Deletes all tags, handy tool if you want to start over with a quick clean blog.
 Version: 1.0
 Author: Ramon Fincken
 Author URI: http://www.mijnpress.nl
 */

function plugin_mass_delete_tags_init() {
	global $current_user;

	// Get tags
	$taxonomy = 'post_tag';
	$all_tags = (array) get_terms($taxonomy,'get=all');

	// Settings
	$limit = 50;
	$timeout = 4; // For refresh

	// Hash based on userid, userlevel and ip
	get_currentuserinfo();
	$ip = preg_replace( '/[^0-9a-fA-F:., ]/', '',$_SERVER['REMOTE_ADDR'] );
	$hash = md5($current_user->ID.$current_user->user_level.$ip);
	$url  = 'plugins.php?page=plugin_mass_delete_tags&hash='.$hash;
	$stop =  false;
	if(count($all_tags) > 0)
	{
		$validated = false;
		if(isset($_POST['plugin_tag_action']) && isset($_POST['plugin_tag_validate']) && $_POST['plugin_tag_validate'] == 'yes')
		{
			$validated = true;
		}
		if(isset($_GET['hash']) && $_GET['hash'] = $hash)
		{
			$validated = true;
		}
			
		if ($validated) {
			$tags = (array) get_terms($taxonomy,'get=all&number='.$limit);
			$i = 0;
			echo 'Deleted ids: ';
			foreach($tags as $tag) {
				wp_delete_term($tag->term_id, $taxonomy);
				echo $tag->term_id.', ';
				$i++;
			}

			echo '<br/><br/>Deleted '.$i.' tags in this page load. Please stand by if the page needs refreshing<br/>';

			if($i >= $limit)
			{
				echo '<br/><br/><meta http-equiv="refresh" content="'.$timeout.';url='.$url.'" />';
				echo '<strong><u>Not done yet</u>!</strong><br/><a href="'.$url.'">Refreshing page! Is this taking more then '.(2*$timeout). ' seconds, please click here</a>';

				die();
			}
			else
			{
				echo '<br/>Removed all tags';
				$stop =  true;
			}
		}

	}



	if ($all_tags && !$stop) {
		echo ' Found '.count($all_tags) . ' tags';
		?>

<h4>By clicking the button you will delete ALL terms</h4>
<form action="plugins.php?page=plugin_mass_delete_tags" method="post"><input
	type="radio" name="plugin_tag_validate" id="plugin_tag_validate_no"
	value="no" checked="checked" /><label for="plugin_tag_validate_no">&nbsp;NO!</label><br />

<input type="radio" name="plugin_tag_validate"
	id="plugin_tag_validate_yes" value="yes" /><label
	for="plugin_tag_validate_yes">&nbsp;Yes, delete all terms (select me to
proceed)</label><br />
<br />

<br />
Note: Staggered delete of (<?php echo $limit; ?>) terms at a time. Page
will auto refresh untill all tags are deleted. <br />
<input type="submit" name="plugin_tag_action" value="<?php _e("Delete Terms") ?>" onclick="javascript:return(confirm('<?php _e("Are you sure you want to delete these terms? There is NO undo!")?>'))" />

</form>

		<?php
	} else {
		echo '<p>' . __('No tags are in use at the moment.') . '</p>';
	}
}


function plugin_mass_delete_tags_menu() {
	if (is_admin()) {
		add_submenu_page("plugins.php", "Delete all tags", "Delete all tags", 10, 'plugin_mass_delete_tags', 'plugin_mass_delete_tags_init');
	}
}

// Admin menu items
add_action('admin_menu', 'plugin_mass_delete_tags_menu');
?>