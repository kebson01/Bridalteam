<?php
/**
 * WordPress Configuration for Production - Blog Site
 * Copy this to wp-config.php and update with your production values
 */

// ** MySQL settings ** //
define('DB_NAME', getenv('WP_BLOG_DB_NAME') ?: 'bridalteam_blog');
define('DB_USER', getenv('WP_BLOG_DB_USER') ?: 'bridalteam_user');
define('DB_PASSWORD', getenv('WP_BLOG_DB_PASSWORD') ?: 'secure_password_here');
define('DB_HOST', getenv('WP_BLOG_DB_HOST') ?: 'db:3306');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// ** Authentication Unique Keys and Salts ** //
// Generate these at: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');
define('AUTH_SALT',        'put your unique phrase here');
define('SECURE_AUTH_SALT', 'put your unique phrase here');
define('LOGGED_IN_SALT',   'put your unique phrase here');
define('NONCE_SALT',       'put your unique phrase here');

// ** WordPress Database Table prefix ** //
$table_prefix = 'wp_blog_';

// ** WordPress debugging ** //
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);

// ** Security Settings ** //
define('DISALLOW_FILE_EDIT', true);
define('DISALLOW_FILE_MODS', true);
define('FORCE_SSL_ADMIN', true);
define('WP_AUTO_UPDATE_CORE', 'minor');

// ** Performance Settings ** //
define('WP_CACHE', true);
define('COMPRESS_CSS', true);
define('COMPRESS_SCRIPTS', true);
define('CONCATENATE_SCRIPTS', true);
define('ENFORCE_GZIP', true);

// ** File Permissions ** //
define('FS_CHMOD_DIR', (0755 & ~ umask()));
define('FS_CHMOD_FILE', (0644 & ~ umask()));

// ** WordPress URLs ** //
define('WP_HOME', getenv('APP_URL') . '/blog');
define('WP_SITEURL', getenv('APP_URL') . '/blog');

// ** Multisite Configuration (if needed) ** //
// define('WP_ALLOW_MULTISITE', true);

// ** Memory Limit ** //
define('WP_MEMORY_LIMIT', '256M');

// ** Absolute path to the WordPress directory ** //
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

// ** Sets up WordPress vars and included files ** //
require_once ABSPATH . 'wp-settings.php';


