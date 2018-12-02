<?php
class Flotheme_Nav_Walker extends Walker_Nav_Menu 
{

	function start_el(&$output, $category, $depth = 0, $args = array(), $current_object_id = 0)
	{
		global $wp_query;
		$indent = ( $depth ) ? str_repeat( "\t", $depth ) : '';
		
		$class_names = $value = '';

		$classes = empty( $item->classes ) ? array() : (array) $item->classes;

		$class_names = join( ' ', apply_filters( 'nav_menu_css_class', array_filter( $classes ), $item ) );
		$class_names = ' class="' . esc_attr( $class_names ) . ' '. sanitize_title( $item->title ) . '"';

		$output .= $indent . '<li id="menu-item-'. $item->ID . '"' . $value . $class_names .'>';

		$attributes  = ! empty( $item->attr_title ) ? ' title="'  . esc_attr( $item->attr_title ) .'"' : '';
		$attributes .= ! empty( $item->target )     ? ' target="' . esc_attr( $item->target     ) .'"' : '';
		$attributes .= ! empty( $item->xfn )        ? ' rel="'    . esc_attr( $item->xfn        ) .'"' : '';
		$attributes .= ! empty( $item->url )        ? ' href="'   . esc_attr( $item->url        ) .'"' : '';

		$item_output = $args->before;
		$item_output .= '<a'. $attributes .'>';
		$item_output .= $args->link_before . apply_filters( 'the_title', $item->title, $item->ID ) . $args->link_after;
		$item_output .= '</a>';
		$item_output .= $args->after;

		$output .= apply_filters( 'walker_nav_menu_start_el', $item_output, $item, $depth, $args );
	}
}	

class Flotheme_Dropdown_Nav_Walker extends Walker_Nav_Menu {

	/**
	 * Easy way to check it's this walker we're using to mod the output
	 * @return boolean 
	 */
	public function is_dropdown() 
	{
		return true;
	}

	/**
	 * @param string $output Passed by reference. Used to append additional content.
	 * @param int $depth Depth of page. Used for padding.
	 */
	public function start_lvl(&$output, $depth = 0, $args = array()) 
	{
		$output .= "</option>";
	}

	/**
	 * @param string $output Passed by reference. Used to append additional content.
	 * @param int $depth Depth of page. Used for padding.
	 */
	public function end_lvl(&$output, $depth = 0, $args = array())
	{
		$output .= "<option>";
	}

	/**
	 * @param string $output Passed by reference. Used to append additional content.
	 * @param object $item Menu item data object.
	 * @param int $depth Depth of menu item. Used for padding.
	 * @param int $current_page Menu item ID.
	 * @param object $args
	 */
	public function start_el(&$output, $category, $depth = 0, $args = array(), $current_object_id = 0)
	{
		global $wp_query;
		$indent = ( $depth ) ? str_repeat( "\t", $depth ) : '';

		$class_names = $value = '';

		$classes = empty( $item->classes ) ? array() : (array) $item->classes;
		$classes[] = 'menu-item-' . $item->ID;
		$classes[] = 'menu-item-depth-' . $depth;

		$class_names = join( ' ', apply_filters( 'nav_menu_css_class', array_unique( array_filter( $classes ) ), $item, $args ) );
		$class_names = ' class="' . esc_attr( $class_names ) . '"';

		// select current item
		$selected = in_array( 'current-menu-item', $classes ) ? ' selected="selected"' : '';

		$output .= $indent . '<option' . $class_names .' value="'. $item->url .'"'. $selected .'>';

		// push sub-menu items in as we can't nest optgroups
		$indent_string = str_repeat( apply_filters( 'dropdown_menus_indent_string', $args->indent_string, $item, $depth, $args ), ( $depth ) ? $depth : 0 );
		$indent_string .= !empty( $indent_string ) ? apply_filters( 'dropdown_menus_indent_after', $args->indent_after, $item, $depth, $args ) : '';

		$item_output = $args->before . $indent_string;
		$item_output .= $args->link_before . apply_filters( 'the_title', $item->title, $item->ID ) . $args->link_after;
		$item_output .= $args->after;

		$output .= apply_filters( 'walker_nav_menu_dropdown_start_el', $item_output, $item, $depth, $args );
	}

	/**
	 * @param string $output Passed by reference. Used to append additional content.
	 * @param object $item Page data object. Not used.
	 * @param int $depth Depth of page. Not Used.
	 */
	public function end_el(&$output, $category, $depth = 0, $args = array())
	{
		$output .= apply_filters( 'walker_nav_menu_dropdown_end_el', "</option>\n", $item, $depth);
	}
}

function flo_dropdown_add_blank_item( $items, $args ) {
	if ( isset( $args->walker ) && is_object( $args->walker ) && method_exists( $args->walker, 'is_dropdown' ) ) {
		if ( ( ! isset( $args->menu ) || empty( $args->menu ) ) && isset( $args->theme_location ) ) {
			$theme_locations = get_nav_menu_locations();
			$args->menu = wp_get_nav_menu_object( $theme_locations[ $args->theme_location ] );
		}
		$title = isset( $args->dropdown_title ) ? wptexturize( $args->dropdown_title ) : '&mdash; ' . (isset($args->menu->name) ? $args->menu->name : '') . ' &mdash;';
		if ( ! empty( $title ) )
			$items = '<option value="" class="blank">' . apply_filters( 'dropdown_blank_item_text', $title, $args ) . '</option>' . $items;
	}
	return $items;
}
add_filter( 'wp_nav_menu_items', 'flo_dropdown_add_blank_item', 10, 2 );

/**
 * Remove empty options created in the sub levels output
 */
function flo_dropdown_remove_empty_items( $items, $args ) {
	if ( isset( $args->walker ) && is_object( $args->walker ) && method_exists( $args->walker, 'is_dropdown' ) )
		$items = str_replace( "<option></option>", "", $items );
	return $items;
}
add_filter('wp_nav_menu_items', 'flo_dropdown_remove_empty_items', 10, 2 );


if (is_admin()) {
	/**
	 * Add Advanced Navigation Checkbox 
	 */
	function flo_inject_archives_menu_meta_box() {
		add_meta_box('flo-nav-advanced', __( 'Advanced Navigation', 'flotheme' ), 'flo_wp_nav_menu_archives_meta_box', 'nav-menus', 'side', 'default');
	}
	add_action( 'admin_head-nav-menus.php', 'flo_inject_archives_menu_meta_box');
	
	/**
	 * Add Advanced Navigation Meta Box 
	 */
	function flo_wp_nav_menu_archives_meta_box() {
		/* get custom post types with archive support */
		$post_types = get_post_types(array('show_in_nav_menus' => true, 'has_archive' => true), 'object');

		/* hydrate the necessary object properties for the walker */
		foreach ($post_types as &$post_type) {
			$post_type->classes = array();
			$post_type->type = $post_type->name;
			$post_type->object_id = $post_type->name;
			$post_type->title = $post_type->labels->name . ' ' . __('Archive', 'default');
			$post_type->object = 'flo-archive';
		}
		
		$walker = new Walker_Nav_Menu_Checklist(array());
		?>
			<div id="flo-archive" class="posttypediv">
			<div id="tabs-panel-flo-archive" class="tabs-panel tabs-panel-active">
				<ul id="ctp-archive-checklist" class="categorychecklist form-no-clear">
					<?php
						echo walk_nav_menu_tree(array_map('wp_setup_nav_menu_item', $post_types), 0, (object) array('walker' => $walker));
					?>
				</ul>
			</div><!-- /.tabs-panel -->
			</div>
			<p class="button-controls">
				<span class="add-to-menu">
					<img class="waiting" src="<?php echo esc_url(admin_url('images/wpspin_light.gif')); ?>" alt="" />
					<input type="submit"<?php disabled($nav_menu_selected_id, 0); ?> class="button-secondary submit-add-to-menu" value="<?php esc_attr_e('Add to Menu'); ?>" name="add-ctp-archive-menu-item" id="submit-flo-archive" />
				</span>
			</p>
		<?php
	}
}
/**
	* Navigation Menu Filter
	* @param array $items
	* @param object $menu
	* @param array $args
	* @return array 
	*/
function flo_archive_menu_filter($items, $menu, $args) {
	foreach ($items as &$item) {
		if ($item->object != 'flo-archive')
			continue;
		$item->url = get_post_type_archive_link($item->type);

		/* set current */
		if (get_query_var('post_type') == $item->type) {
			$item->classes [] = 'current-menu-item';
			$item->current = true;
		}
	}

	return $items;
}
add_filter( 'wp_get_nav_menu_items', 'flo_archive_menu_filter', 10, 3 );


