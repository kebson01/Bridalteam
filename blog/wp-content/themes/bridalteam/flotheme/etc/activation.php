<?php
if (!(defined('MULTISITE') && MULTISITE)) {
	if (is_admin() && isset($_GET['activated']) && 'themes.php' == $GLOBALS['pagenow']) {
		wp_redirect(admin_url('admin.php?page=flotheme_theme_activation'));
		exit;
	}
	
	function flotheme_activation_is_config_writable() {
		$home_path = get_home_path();
		$iis7_permalinks = iis7_supports_permalinks();
		if ( $iis7_permalinks ) {
			if ( ( ! file_exists($home_path . 'web.config') && win_is_writable($home_path) ) || win_is_writable($home_path . 'web.config') )
				$config_writable = true;
			else
				$config_writable = false;
		} else {
			if ( ( ! file_exists($home_path . '.htaccess') && is_writable($home_path) ) || is_writable($home_path . '.htaccess') )
				$config_writable = true;
			else
				$config_writable = false;
		}
		
		return $config_writable;
	}

	function flotheme_theme_activation_init() {
		if (flotheme_get_theme_activation() === false) {
			add_option('flotheme_theme_activation', flotheme_get_default_theme_activation());
		}

		register_setting(
			'flotheme_activation', 'flotheme_theme_activation', 'flotheme_theme_activation_validate'
		);
	}

	add_action('admin_init', 'flotheme_theme_activation_init');

	function flotheme_activation_page_capability($capability) {
		return 'edit_theme_options';
	}

	add_filter('option_page_capability_flotheme_activation', 'flotheme_activation_page_capability');

	function flotheme_theme_activation_add_page() {
		$flotheme_activation = flotheme_get_theme_activation();

		if (!$flotheme_activation['first_run']) {
			add_submenu_page('flotheme', __('Theme Activation', 'flotheme'), __('Theme Activation', 'flotheme'), 'edit_theme_options', 'flotheme_theme_activation', 'flotheme_theme_activation_render_page');
		} else {
			if (is_admin() && isset($_GET['page']) && $_GET['page'] === 'flotheme_theme_activation') {
				wp_redirect(admin_url('admin.php?page=flotheme'));
				exit;
			}
		}
	}

	add_action('admin_menu', 'flotheme_theme_activation_add_page', 50);

	function flotheme_get_default_theme_activation() {
		$default_theme_activation = array(
			'first_run' => false,
			'create_front_page' => false,
			'create_blog_page' => false,
			'change_permalink_structure' => false,
			'change_uploads_folder' => false,
			'create_navigation_menus' => false,
			'add_pages_to_primary_navigation' => false,
		);

		return apply_filters('flotheme_default_theme_activation', $default_theme_activation);
	}

	function flotheme_get_theme_activation() {
		return get_option('flotheme_theme_activation', flotheme_get_default_theme_activation());
	}

	function flotheme_theme_activation_render_page() {
		?>

		<div class="wrap">
			<?php screen_icon('flotheme'); ?>
			<h2><?php printf(__('%s Theme Activation', 'flotheme'), get_current_theme()); ?></h2>
			<?php settings_errors(); ?>

			<form method="post" action="options.php">

				<?php
					settings_fields('flotheme_activation');
					$flotheme_activation = flotheme_get_theme_activation();
					$flotheme_default_activation = flotheme_get_default_theme_activation();

					$config_writable = flotheme_activation_is_config_writable();
				?>

				<input type="hidden" value="1" name="flotheme_theme_activation[first_run]" />
				
				<?php if (!$config_writable) : ?>
					<div class="error">
						<p>If your <code>.htaccess</code> file were <a href="http://codex.wordpress.org/Changing_File_Permissions" target="_blank">writable</a>, we could do this automatically, but it isn&#8217;t so these are the mod_rewrite rules you should have in your <code>.htaccess</code> file. Please go to <a href="<?php echo admin_url('options-permalink.php') ?>">Permalinks</a> page in your <strong>Settings</strong> tab and adjust your links manually.</p>
					</div>
				<?php endif; ?>
				
				<table class="form-table">

					<tr valign="top"><th scope="row"><?php _e('Create static front page?', 'flotheme'); ?></th>
						<td>
							<fieldset><legend class="screen-reader-text"><span><?php _e('Create static front page?', 'flotheme'); ?></span></legend>
								<select name="flotheme_theme_activation[create_front_page]" id="create_front_page">
									<option selected="selected" value="yes"><?php echo _e('Yes', 'flotheme'); ?></option>
									<option value="no"><?php echo _e('No', 'flotheme'); ?></option>
								</select>
								<span class="description"><?php printf(__('Create a page called Home and set it to be the static front page', 'flotheme')); ?></span>
							</fieldset>
						</td>
					</tr>

					<tr valign="top"><th scope="row"><?php _e('Create a blog page?', 'flotheme'); ?></th>
						<td>
							<fieldset><legend class="screen-reader-text"><span><?php _e('Create a blog page?', 'flotheme'); ?></span></legend>
								<select name="flotheme_theme_activation[create_blog_page]" id="create_blog_page">
									<option selected="selected" value="yes"><?php echo _e('Yes', 'flotheme'); ?></option>
									<option value="no"><?php echo _e('No', 'flotheme'); ?></option>
								</select>
								<span class="description"><?php printf(__('Create a page called Blog and set it to be the posts page', 'flotheme')); ?></span>
							</fieldset>
						</td>
					</tr>

					<tr valign="top"><th scope="row"><?php _e('Change permalink structure?', 'flotheme'); ?></th>
						<td>
							<fieldset><legend class="screen-reader-text"><span><?php _e('Update permalink structure?', 'flotheme'); ?></span></legend>
								<?php if ($config_writable) : ?>
									<select name="flotheme_theme_activation[change_permalink_structure]" id="change_permalink_structure">
										<option selected="selected" value="yes"><?php echo _e('Yes', 'flotheme'); ?></option>
										<option value="no"><?php echo _e('No', 'flotheme'); ?></option>
									</select>
									<span class="description"><?php printf(__('Change permalink structure to /&#37;postname&#37;/', 'flotheme')); ?></span>
								<?php else: ?>
									<input type="hidden" name="flotheme_theme_activation[change_permalink_structure]" value="no" />
									<strong class="error" style="color:#c00">No</strong>
								<?php endif; ?>
							</fieldset>
						</td>
					</tr>
					<tr valign="top"><th scope="row"><?php _e('Create navigation menu?', 'flotheme'); ?></th>
						<td>
							<fieldset><legend class="screen-reader-text"><span><?php _e('Create navigation menu?', 'flotheme'); ?></span></legend>
								<select name="flotheme_theme_activation[create_navigation_menus]" id="create_navigation_menus">
									<option selected="selected" value="yes"><?php echo _e('Yes', 'flotheme'); ?></option>
									<option value="no"><?php echo _e('No', 'flotheme'); ?></option>
								</select>
								<span class="description"><?php printf(__('Create the Primary Navigation menu and set the location', 'flotheme')); ?></span>
							</fieldset>
						</td>
					</tr>

					<tr valign="top"><th scope="row"><?php _e('Add pages to menu?', 'flotheme'); ?></th>
						<td>
							<fieldset><legend class="screen-reader-text"><span><?php _e('Add pages to menu?', 'flotheme'); ?></span></legend>
								<select name="flotheme_theme_activation[add_pages_to_primary_navigation]" id="add_pages_to_primary_navigation">
									<option selected="selected" value="yes"><?php echo _e('Yes', 'flotheme'); ?></option>
									<option value="no"><?php echo _e('No', 'flotheme'); ?></option>
								</select>
								<span class="description"><?php printf(__('Add all current published pages to the Primary Navigation', 'flotheme')); ?></span>
							</fieldset>
						</td>
					</tr>

				</table>

				<?php submit_button(); ?>
			</form>
		</div>

		<?php
	}

	function flotheme_theme_activation_validate($input) {
		$output = $defaults = flotheme_get_default_theme_activation();

		if (isset($input['first_run'])) {
			if ($input['first_run'] === '1') {
				$input['first_run'] = true;
			}
			$output['first_run'] = $input['first_run'];
		}

		if (isset($input['create_front_page'])) {
			if ($input['create_front_page'] === 'yes') {
				$input['create_front_page'] = true;
			}
			if ($input['create_front_page'] === 'no') {
				$input['create_front_page'] = false;
			}
			$output['create_front_page'] = $input['create_front_page'];
		}

		if (isset($input['create_blog_page'])) {
			if ($input['create_blog_page'] === 'yes') {
				$input['create_blog_page'] = true;
			}
			if ($input['create_blog_page'] === 'no') {
				$input['create_blog_page'] = false;
			}
			$output['create_blog_page'] = $input['create_blog_page'];
		}

		if (isset($input['change_permalink_structure'])) {
			if ($input['change_permalink_structure'] === 'yes') {
				$input['change_permalink_structure'] = true;
			}
			if ($input['change_permalink_structure'] === 'no') {
				$input['change_permalink_structure'] = false;
			}
			$output['change_permalink_structure'] = $input['change_permalink_structure'];
		}

		if (isset($input['create_navigation_menus'])) {
			if ($input['create_navigation_menus'] === 'yes') {
				$input['create_navigation_menus'] = true;
			}
			if ($input['create_navigation_menus'] === 'no') {
				$input['create_navigation_menus'] = false;
			}
			$output['create_navigation_menus'] = $input['create_navigation_menus'];
		}

		if (isset($input['add_pages_to_primary_navigation'])) {
			if ($input['add_pages_to_primary_navigation'] === 'yes') {
				$input['add_pages_to_primary_navigation'] = true;
			}
			if ($input['add_pages_to_primary_navigation'] === 'no') {
				$input['add_pages_to_primary_navigation'] = false;
			}
			$output['add_pages_to_primary_navigation'] = $input['add_pages_to_primary_navigation'];
		}

		return apply_filters('flotheme_theme_activation_validate', $output, $input, $defaults);
	}

	function flotheme_theme_activation_action() {
		$flotheme_theme_activation = flotheme_get_theme_activation();

		// add homepage
		if ($flotheme_theme_activation['create_front_page']) {
			$flotheme_theme_activation['create_front_page'] = false;

			$default_pages = array('Home');
			$existing_pages = get_pages();
			$temp = array();

			foreach ($existing_pages as $page) {
				$temp[] = $page->post_title;
			}

			$pages_to_create = array_diff($default_pages, $temp);

			foreach ($pages_to_create as $new_page_title) {
				$add_default_pages = array(
					'post_title' => $new_page_title,
					'post_content' => '',
					'post_status' => 'publish',
					'post_type' => 'page'
				);

				$result = wp_insert_post($add_default_pages);
			}

			$home = get_page_by_title('Home');
			update_option('show_on_front', 'page');
			update_option('page_on_front', $home->ID);

			$home_menu_order = array(
				'ID' => $home->ID,
				'menu_order' => -1
			);
			wp_update_post($home_menu_order);
		}

		// add blog page
		if ($flotheme_theme_activation['create_blog_page']) {
			$flotheme_theme_activation['create_blog_page'] = false;

			$default_pages = array('Blog');
			$existing_pages = get_pages();
			$temp = array();

			foreach ($existing_pages as $page) {
				$temp[] = $page->post_title;
			}

			$pages_to_create = array_diff($default_pages, $temp);

			foreach ($pages_to_create as $new_page_title) {
				$add_default_pages = array(
					'post_title' => $new_page_title,
					'post_content' => '',
					'post_status' => 'publish',
					'post_type' => 'page'
				);
				$result = wp_insert_post($add_default_pages);
			}

			$blog = get_page_by_title('Blog');

			update_option('page_for_posts', $blog->ID);

			$blog_menu_order = array(
				'ID' => $blog->ID,
				'menu_order' => 1
			);
			wp_update_post($blog_menu_order);
		}

		// change permalink structure
		if ($flotheme_theme_activation['change_permalink_structure']) {
			$flotheme_theme_activation['change_permalink_structure'] = false;

			if (get_option('permalink_structure') !== '/%postname%/') {
				update_option('permalink_structure', '/%postname%/');
			}

			global $wp_rewrite;
			$wp_rewrite->init();
			$wp_rewrite->flush_rules();
		}

		if ($flotheme_theme_activation['create_navigation_menus']) {
			$flotheme_theme_activation['create_navigation_menus'] = false;

			$flotheme_nav_theme_mod = false;

			if (!has_nav_menu('primary_navigation')) {
				$primary_nav_id = wp_create_nav_menu('Primary Navigation', array('slug' => 'primary_navigation'));
				$flotheme_nav_theme_mod['primary_navigation'] = $primary_nav_id;
			}

			if ($flotheme_nav_theme_mod) {
				set_theme_mod('nav_menu_locations', $flotheme_nav_theme_mod);
			}
		}

		// add all pages to navigation
		if ($flotheme_theme_activation['add_pages_to_primary_navigation']) {
			$flotheme_theme_activation['add_pages_to_primary_navigation'] = false;

			$primary_nav = wp_get_nav_menu_object('Primary Navigation');
			$primary_nav_term_id = (int) $primary_nav->term_id;
			$menu_items = wp_get_nav_menu_items($primary_nav_term_id);
			if (!$menu_items || empty($menu_items)) {
				$pages = get_pages();
				foreach ($pages as $page) {
					$item = array(
						'menu-item-object-id' => $page->ID,
						'menu-item-object' => 'page',
						'menu-item-type' => 'post_type',
						'menu-item-status' => 'publish'
					);
					wp_update_nav_menu_item($primary_nav_term_id, 0, $item);
				}
			}
		}

		update_option('flotheme_theme_activation', $flotheme_theme_activation);
	}

	add_action('admin_init', 'flotheme_theme_activation_action');

	function flotheme_deactivation_action() {
		update_option('flotheme_theme_activation', flotheme_get_default_theme_activation());
	}

	add_action('switch_theme', 'flotheme_deactivation_action');
}