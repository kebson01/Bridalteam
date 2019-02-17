<?php

// Add About Us menu
function register_menus() {
	register_nav_menu( 'main', __( 'Main Menu', 'postlight-headless-wp' ) );
	register_nav_menu( 'footer', __( 'Footer Navigation', 'postlight-headless-wp' ) );
	register_nav_menu( 'plan', __( 'Plan Menu', 'postlight-headless-wp' ) );
	register_nav_menu( 'connect', __( 'Connect Menu', 'postlight-headless-wp' ) );
	register_nav_menu( 'company', __( 'Company Menu', 'postlight-headless-wp' ) );
}
add_action( 'after_setup_theme', 'register_menus' );
