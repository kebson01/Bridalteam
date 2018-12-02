<?php
/**
Plugin Name: Redirect Front-end to Login | Headless WP
Description: Redirects all front-end pages to the login page, best for building a headless WP REST API backend
Author: Benjamin Intal, Gambit Technologies, Inc.
Version: 1.0
Author URI: http://gambit.ph
Plugin URI: http://wordpress.org/plugins/redirect-front-end-to-login-headless-wp
Domain Path: /languages
 *
 * @package Headless WP
 */

if ( ! defined( 'ABSPATH' ) ) { exit; // Exit if accessed directly.
}

if ( ! function_exists( 'headless_redirect_all_to_login' ) ) {
	add_filter( 'wp', 'headless_redirect_all_to_login', 0 );
	function headless_redirect_all_to_login() {
		if ( ! is_admin() ) {
			header( 'HTTP/1.1 403 Forbidden' );
			header( 'Location: ' . wp_login_url() );
			die();
		}
	}
}
