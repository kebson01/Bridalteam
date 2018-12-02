<?php
/**
 * Plugin Name:   Bridal Team Administration
 * Plugin URI:    
 * Text Domain:   bridalteamadmin
 * Domain Path:   /languages
 * Description:   Shows the WordPress admin styles on one page to help you to develop WordPress compliant
 * Author:        Joseph Pender
 * Version:       1.0.0
 * Licence:       None
 * Author URI:    
 * Last Change:   
 */

if(!defined('ABSPATH')) exit; // Exit if accessed directly

add_filter('admin_menu', 'bridalteam_admin_menus');
add_action('admin_enqueue_scripts', 'bridalteam_load_scripts');
add_action('rest_api_init', function() {
    register_rest_field('page', 'blogposts', array("get_callback" => "bridalteam_get_blogposts"));
});

function bridalteam_get_blogposts($object, $field_name, $request) {
    $page_for_posts = get_option('page_for_posts');
    if ($object['id'] == $page_for_posts) {
        $blogposts = get_posts(array(
            "posts_per_page" => 10
        ));
        
        return $blogposts;
    }

    return array();
}

function bridalteam_admin_menus(){
    add_menu_page("Vendors", "Vendors", "edit_posts", "bridalteamadmin_vendors", "bridalteam_render_vendor_admin");    
    add_submenu_page(null, "Edit Vendor", "Edit Vendor", "edit_posts", "bridalteamadmin_editvendor", "bridalteam_render_editvendor_admin" );
    add_submenu_page(null, "Review Claim", "Review Claim", "edit_posts", "bridalteamadmin_reviewclaim", "bridalteam_render_reviewclaim_admin" );

    add_menu_page("Media Review", "Media Review", "edit_posts", "bridalteamadmin_media", "bridalteam_render_media_review");
    add_submenu_page(null, 'Review Media', 'Review Media', 'edit_posts', 'bridalteamadmin_editmedia', 'bridalteam_render_editmedia_admin' );
}

function bridalteam_load_scripts(){
    wp_enqueue_script('bridalteamwp_reactapp', plugin_dir_url( __FILE__ ) . 'js/bundle.js?v=1.0', null, null, true);    
}

function bridalteam_render_editvendor_admin(){
    ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Edit Vendor #ID <?php print $_GET['id']; ?></h1>
            <div id="bridalteamadmin_editvendor">Editing a vendor</div>            
        </div>
    <?php
}

function bridalteam_render_reviewclaim_admin(){
    ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Review Vendor Claim #ID <?php print $_GET['id']; ?></h1>
            <div id="bridalteamadmin_reviewclaim">Reviewing a vendor claim</div>            
        </div>
    <?php
}

function bridalteam_render_editmedia_admin(){
    ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Review Media</h1>
            <div id="bridalteamadmin_editmedia">Reviewing a media entry</div>            
        </div>
    <?php
}

function bridalteam_render_vendor_admin(){
    ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Vendors</h1>
            <div id="bridalteamadmin_vendor"></div>            
        </div>
    <?php
}

function bridalteam_render_media_review(){
    ?>
        <div class="wrap">
            <h1 class="wp-heading-inline">Media Review</h1>
            <div id="bridalteamadmin_media"></div>
        </div>
    <?php
}
