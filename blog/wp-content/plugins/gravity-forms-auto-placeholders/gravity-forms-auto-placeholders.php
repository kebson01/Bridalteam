<?php
/*
Plugin Name: Gravity Forms Auto Placeholders
Plugin URI: http://thebyob.com/gravity-forms-auto-placeholders
Description: Automatically converts all Gravity Form labels into HTML5 placeholders. Includes Modernizr to add placeholder support to Internet Explorer.
Version: 1.2
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

class GravityFormsAutoPlaceholders {
	protected static $_version = '1.2';

	public static function enqueue() {
		$plugin_url = plugins_url( '/', __FILE__ );
		wp_enqueue_script(
			'gravityformsautoplaceholders_modernizr_placeholders',
			$plugin_url . 'modernizr.placeholder.min.js',
			array( 'jquery' ),
			self::$_version
		);
		wp_enqueue_script(
			'gravityformsautoplaceholders_scripts',
			$plugin_url . 'scripts.js',
			array( 'jquery', 'gravityformsautoplaceholders_modernizr_placeholders' ),
			self::$_version
		);
		$gfap_class = get_option( 'gfap_class' );
		wp_localize_script(
			'gravityformsautoplaceholders_scripts',
			'gravityformsautoplaceholders',
			array(
				'class_specific' => !empty( $gfap_class ) ? true : false,
			)
		);
	}
}

add_action( 'wp_enqueue_scripts', array( 'GravityFormsAutoPlaceholders', 'enqueue' ) );

?>
