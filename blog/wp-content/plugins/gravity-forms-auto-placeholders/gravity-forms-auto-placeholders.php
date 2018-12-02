<?php
/*
Plugin Name: Gravity Forms Auto Placeholders
Plugin URI: http://thebyob.com/gravity-forms-auto-placeholders
Description: Automatically converts all Gravity Form labels into HTML5 placeholders. Includes Modernizr to add placeholder support to Internet Explorer.
Version: 1.1
Author: Josh Davis
Author URI: http://josh.dvvvvvvvv.com/
*/

/*  Copyright 2012  Josh Davis

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

function gfap_load_scripts() {
	wp_enqueue_script('jquery');
	wp_register_script('modernizr', 'http://cdnjs.cloudflare.com/ajax/libs/modernizr/2.6.2/modernizr.min.js', array('jquery'));
	wp_enqueue_script('modernizr');
}    
add_action('wp_enqueue_scripts', 'gfap_load_scripts');

function register_gfap_settings() {
	$setting_vars = array(
		'gfap_class',
		);
	foreach ( $setting_vars as $setting_var ){
		register_setting( 'gfap_mystery', $setting_var );
	}
}
add_action( 'admin_init', 'register_gfap_settings' );

function gfap_menu() {
	add_options_page( 'Gravity Forms Auto Placeholders Settings', 'Gravity Forms Auto Placeholders', 'manage_options', 'gfap_uid', 'gfap_options' );
}

function gfap_options() {
	if ( !current_user_can( 'manage_options' ) )  {
		wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
	}
	echo '<div class="wrap"><h2>Gravity Forms Auto Placeholders Settings</h2><form method="post" action="options.php">';
	settings_fields('gfap_mystery');
?>

<style>.wrap form td span{color:#888;} .wrap legend{font-size:13px; font-weight:bold; margin-left:-5px;} .wrap fieldset{margin:10px 0px; padding:15px; padding-top:0px; border:1px solid #ccc;}</style>
<fieldset>
	<legend>Convert labels to placeholders:</legend>
	<table class="form-table">
		<tr><td><input type="checkbox" name="gfap_class" value="1" <?php checked( '1', get_option( 'gfap_class' ) ); ?> /> Only on forms or form items with the class <b><i>gfap_placeholder</b></i> <span>- By default, leaving this unchecked will apply the effect to all Gravity Forms</span></td></tr>
	</table>
</fieldset>
<p class="submit">
<input type="submit" class="button-primary" value="<?php _e('Save Changes') ?>" />
</p>

<?php
	echo '</form></div>';
}
add_action( 'admin_menu', 'gfap_menu' );

function gfap_script() { ?>

<script>
// Start allowance of jQuery to $ shortcut
jQuery(document).ready(function($){

	// Convert label to placeholder
	<?php 
		$gfap_class_pc = get_option('gfap_class');
		if ($gfap_class_pc) {
			$gfap_class = 'gfap_placeholder';
		}
		else {
			$gfap_class = 'gform_wrapper';
		}
	?>
	$.each($('.<?php echo $gfap_class; ?> input, .<?php echo $gfap_class; ?> textarea'), function () {
		var gfapId = this.id;
		var gfapLabel = $('label[for=' + gfapId + ']');
		$(gfapLabel).hide();
		var gfapLabelValue = $(gfapLabel).text();
		$(this).attr('placeholder',gfapLabelValue);
	});

	// Use modernizr to add placeholders for IE
	if(!Modernizr.input.placeholder){$("input,textarea").each(function(){if($(this).val()=="" && $(this).attr("placeholder")!=""){$(this).val($(this).attr("placeholder"));$(this).focus(function(){if($(this).val()==$(this).attr("placeholder")) $(this).val("");});$(this).blur(function(){if($(this).val()=="") $(this).val($(this).attr("placeholder"));});}});}

// Ends allowance of jQuery to $ shortcut
});
</script>

<?php

}

add_action('wp_head', 'gfap_script');

?>
