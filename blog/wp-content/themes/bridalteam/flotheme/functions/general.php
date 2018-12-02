<?php
/**
 * Get option wrapper
 * @param mixed $name
 * @param mixed $default
 * @return mixed 
 */
function flo_option($name, $default = false) {
	echo flo_get_option($name, $default);
}
function flo_filtered_option($name, $default = false, $filter = 'the_content') {
	echo apply_filters($filter, flo_get_option($name, $default));
}
function flo_get_option($name, $default = false) {
	$name = 'flo_' . $name;
	if (false === $default) {
		$options = flotheme_get_options();
		foreach ($options as $option) {
			if (isset($option['id']) && $option['id'] == $name) {
				$default = isset($option['std']) ? $option['std'] : false;
				break;
			}
		}
	}
	return of_get_option($name, $default);
}

/**
 * Echo meta for post
 * @param string $key
 * @param boolean $single
 * @param mixed $post_id 
 */
function flo_meta($key, $single = true, $post_id = null) {
	echo flo_get_meta($key, $single, $post_id);
}
/**
 * Find meta for post
 * @param string $key
 * @param boolean $single
 * @param mixed $post_id 
 */
function flo_get_meta($key, $single = true, $post_id = null) {
	if (null === $post_id) {
		$post_id = get_the_ID();
	}
	$key = 'flo_' . $key;
	return get_post_meta($post_id, $key, $single);
}
/**
 * Apply filters to post meta
 * @param string $key
 * @param string $filter
 * @param mixed $post_id 
 */
function flo_filtered_meta($key, $filter = 'the_content', $post_id = null) {
	echo apply_filters($filter, flo_get_meta($key, true, $post_id));
}

/**
 * Display permalink 
 * 
 * @param int|string $system
 * @param int $isCat 
 */
function flo_permalink($system, $isCat = false) {
    echo flo_get_permalink($system, $isCat);
}
/**
 * Get permalink for page, post or category
 * 
 * @param int|string $system
 * @param bool $isCat
 * @return string
 */
function flo_get_permalink($system, $isCat = 0)  {
    if ($isCat) {
        if (!is_numeric($system)) {
            $system = get_cat_ID($system);
        }
        return get_category_link($system);
    } else {
        $page = flo_get_page($system);
        
        return null === $page ? '' : get_permalink($page->ID);
    }
}

/**
 * Display custom excerpt
 */
function flo_excerpt() {
    echo flo_get_excerpt();
}
/**
 * Get only excerpt, without content.
 * 
 * @global object $post
 * @return string 
 */
function flo_get_excerpt() {
    global $post;
	$excerpt = trim($post->post_excerpt);
	$excerpt = $excerpt ? apply_filters('the_content', $excerpt) : '';
    return $excerpt;
}

/**
 * Display first category link
 */
function flo_first_category() {
    $cat = flo_get_first_category();
	if (!$cat) {
		echo '';
		return;
	}
    echo '<a href="' . flo_get_permalink($cat->cat_ID, true) . '">' . $cat->name . '</a>';
}
/**
 * Parse first post category
 */
function flo_get_first_category() {
    $cats = get_the_category();
    return isset($cats[0]) ? $cats[0] : null;
}

/**
 * Get page by name, id or slug. 
 * @global object $wpdb
 * @param mixed $name
 * @return object 
 */
function flo_get_page($slug) {
    global $wpdb;
    
    if (is_numeric($slug)) {
        $page = get_page($slug);
    } else {
        $page = $wpdb->get_row($wpdb->prepare("SELECT DISTINCT * FROM $wpdb->posts WHERE post_name=%s AND post_status=%s", $slug, 'publish'));
    }
    
    return $page;
}

/**
 * Find all subpages for page
 * @param int $id
 * @return array
 */
function flo_get_subpages($id) {
    $query = new WP_Query(array(
        'post_type'         => 'page',
        'orderby'           => 'menu_order',
        'order'             => 'ASC',
        'posts_per_page'    => -1,
        'post_parent'       => (int) $id,
    ));

    $entries = array();
    while ($query->have_posts()) : $query->the_post();
        $entry = array(
            'id' => get_the_ID(),
            'title' => get_the_title(),
            'link' => get_permalink(),
            'content' => get_the_content(),
        );
        $entries[] = $entry;
    endwhile;
    wp_reset_query();
    return $entries;
}

function flo_page_links() {
	global $wp_query, $wp_rewrite;
	$wp_query->query_vars['paged'] > 1 ? $current = $wp_query->query_vars['paged'] : $current = 1;
 
	$pagination = array(
		'base' => @add_query_arg('page','%#%'),
		'format' => '',
		'total' => $wp_query->max_num_pages,
		'current' => $current,
		'show_all' => false,
		'type' => 'list',
		'next_text' => '&raquo;',
		'prev_text' => '&laquo;'
		);
 
	if( $wp_rewrite->using_permalinks() )
		$pagination['base'] = user_trailingslashit( trailingslashit( remove_query_arg( 's', get_pagenum_link( 1 ) ) ) . 'page/%#%/', 'paged' );
 
	if( !empty($wp_query->query_vars['s']) )
		$pagination['add_args'] = array( 's' => str_replace( " ", '+', get_query_var( 's' ) ) );
 
	echo paginate_links($pagination);
}


/**
 * Generate random number
 *
 * Creates a 4 digit random number for used
 * mostly for unique ID creation. 
 * 
 * @return integer 
 */
function flo_get_random_number() {
	return substr( md5( uniqid( rand(), true) ), 0, 4 );
}

/**
 * Retreive Google Fonts List.
 * 
 * @return array 
 */
function flo_get_google_webfonts()
{
	return array(
		'Abril+Fatface'						=> 'Abril Fatface',
		'Open+Sans'							=> 'Open Sans',
		'Gentium+Book+Basic'				=> 'Gentium Book Basic',
		'Vollkorn'							=> 'Vollkorn',
		'Gravitas+One'						=> 'Gravitas+One',
		'Lato'								=> 'Lato',
		'Old+Standard+TT'					=> 'Old Standard TT',
		'PT+Serif'							=> 'PT Serif',
		'PT+Sans+Narrow'					=> 'PT Sans Narrow',
		'PT+Sans'							=> 'PT Sans',
		'Molengo'							=> 'Molengo',
		'Merriweather'						=> 'Merriweather',
		'Cabin'								=> 'Cabin',
		'Lobster'							=> 'Lobster',
		'Raleway'							=> 'Raleway',
		'Crimson+Text'						=> 'Crimson+Text',
		'Arvo'								=> 'Arvo',
		'Dancing+Script'					=> 'Dancing Script',
		'Josefin+Sans'						=> 'Josefin Sans',
		'Droid+Serif'						=> 'Droid Serif',
		'Droid+Sans'						=> 'Droid Sans',
		'Corben'							=> 'Corben',
		'Nobile'							=> 'Nobile',
		'Ubuntu'							=> 'Ubuntu',
		'Bree+Serif'						=> 'Bree Serif',
		'Bevan'								=> 'Bevan',
		'Potato+Sans'						=> 'Potato Sans',
		'Average'							=> 'Average',
		'Istok+Web'							=> 'Istok Web',
		'Lora'								=> 'Lora',
		'Pacifico'							=> 'Pacifico',
		'Arimo'								=> 'Arimo',
		'Cantata+One'						=> 'Cantata One',
		'Imprima'							=> 'Imprima',	
		'Puritan'							=> 'Puritan',
	);
}

/**
 * Get Save Web Fonts
 * @return array
 */
function flo_get_safe_webfonts() {
	return array(
		'Arial'				=> 'Arial',
		'Verdana'			=> 'Verdana, Geneva',
		'Trebuchet'			=> 'Trebuchet',
		'Georgia'			=> 'Georgia',
		'Times New Roman'   => 'Times New Roman',
		'Tahoma'			=> 'Tahoma, Geneva',
		'Palatino'			=> 'Palatino',
		'Helvetica'			=> 'Helvetica',
		'Gill Sans'			=> 'Gill Sans',
	);
}

function flo_get_typo_styles() {
	return array(
		'normal'      => 'Normal',
		'italic'      => 'Italic',
	);
}

function flo_get_typo_weights() {
	return array(
		'normal'      => 'Normal',
		'bold'      => 'Bold',
	);
}

function flo_get_typo_transforms() {
	return array(
		'none'      => 'None',
		'uppercase'	=> 'UPPERCASE',
		'lowercase'	=> 'lowercase',
		'capitalize'=> 'Capitalize',
	);
}

function flo_get_typo_variants() {
	return array(
		'normal'      => 'normal',
		'small-caps'  => 'Small Caps',
	);
}

/**
 * Get default font styles
 * @return array
 */
function flo_get_font_styles() {
	return array(
		'normal'      => 'Normal',
		'italic'      => 'Italic',
		'bold'        => 'Bold',
		'bold italic' => 'Bold Italic'
	);
}

/**
 * Display custom RSS url
 */
function flo_rss() {
    echo flo_get_rss();
}

/**
 * Get custom RSS url
 */
function flo_get_rss() {
    $rss_url = flo_get_option('feedburner');
    return $rss_url ? $rss_url : get_bloginfo('rss2_url');
}

/**
 * Display custom RSS url
 */
function flo_favicon() {
    echo flo_get_favicon();
}

/**
 * Get custom RSS url
 */
function flo_get_favicon() {
    $favicon = flo_get_option('favicon');
    return $favicon ? $favicon : THEME_URL . '/flotheme/assets/favicon.ico';
}

/**
 * Get template part
 * 
 * @param string $slug
 * @param string $name
 */
function flo_part($slug, $name = null) {
	get_template_part('partials/' . $slug, $name);
}

/**
 * Page Title Wrapper
 * @param type $title 
 */
function flo_page_title($title) {
	echo flo_get_page_title($title);
}
function flo_get_page_title($title) {
	return '<header class="page-title"><h2 class="a">' . __($title, 'flotheme') . '</h2></header>';
}

/**
 * Find if the current browser is on mobile device
 * @return boolean 
 */
function is_mobile() {
	if(preg_match('/(alcatel|amoi|android|avantgo|blackberry|benq|cell|cricket|docomo|elaine|htc|iemobile|iphone|ipad|ipaq|ipod|j2me|java|midp|mini|mmp|mobi|motorola|nec-|nokia|palm|panasonic|philips|phone|sagem|sharp|sie-|smartphone|sony|symbian|t-mobile|telus|up\.browser|up\.link|vodafone|wap|webos|wireless|xda|xoom|zte)/i', $_SERVER['HTTP_USER_AGENT'])) {
		return true;
	} else {
		return false;
	}
}

function array_put_to_position(&$array, $object, $position, $name = null) {
	$count = 0;
	$return = array();
	foreach ($array as $k => $v) {  
			// insert new object
			if ($count == $position) {  
					if (!$name) $name = $count;
					$return[$name] = $object;
					$inserted = true;
			}  
			// insert old object
			$return[$k] = $v;
			$count++;
	}  
	if (!$name) $name = $count;
	if (!$inserted) $return[$name];
	$array = $return;
	return $array;
}

/**
 * Get a short link for given URL.
 * 
 * @param string $url
 * @return string
 */
function tinyurl_generate($url) {
	$tinyurl = file_get_contents("http://tinyurl.com/api-create.php?url=".$url);
	return $tinyurl;
}

/**
 * Get archives by year
 * 
 * @global object $wpdb
 * @param string $year
 * @return array 
 */
function flo_archives_get_by_year($year = "") {
	global $wpdb;
	
	$where = "";
	if (!empty($year)) {
		$where = "AND YEAR(post_date) = " . ((int) $year);
	}
	$query = "SELECT DISTINCT YEAR(post_date) AS `year`, MONTH(post_date) AS `month`, DATE_FORMAT(post_date, '%b') AS `abmonth`, DATE_FORMAT(post_date, '%M') AS `fmonth`, count(ID) as posts
									FROM $wpdb->posts
							WHERE post_type = 'post' AND post_status = 'publish' $where
									GROUP BY YEAR(post_date), MONTH(post_date)
									ORDER BY post_date DESC";

	return $wpdb->get_results($query);
}

/**
 * Get archives years list
 * 
 * @global object $wpdb
 * @return array 
 */
function flo_archives_get_years() {
	global $wpdb;

	$query = "SELECT DISTINCT YEAR(post_date) AS `year`
									FROM $wpdb->posts
							WHERE post_type = 'post' AND post_status = 'publish'
									GROUP BY YEAR(post_date) ORDER BY post_date DESC";

	return $wpdb->get_results($query);
}

/**
 * Get archives months list
 * 
 * @return type 
 */
function flo_archives_get_months() {
	return array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
}

/**
 * Display Archives 
 */
function flo_archives($delim = '&nbsp;/&nbsp;') {
    $year = null;
    ?>
    <div class="flo-archives cf">
		<h4 class="a"><?php _e('Archives', 'flotheme');?></h4>
        <?php
            $months = flo_archives_get_months();
            $archives = flo_archives_get_by_year();
        ?>
        <div class="year">
            <span id="archives-active-year"></span>
            <a href="#" class="up">&gt;</a>
            <a href="#" class="down">&lt;</a>
        </div>
        <div class="months">
            <?php foreach ($archives as $archive) : ?>
                <?php
                    if ($year == $archive->year) {
                        continue;
                    }
                    $year = $archive->year;
                    $y_archives = flo_archives_get_by_year($archive->year);
                ?>
                <div class="year-months" id="archive-year-<?php echo $year?>">
                <?php foreach ($months as $key => $month) :?>
                    <?php foreach ($y_archives as $y_archive) :?>
                        <?php if (($key == ($y_archive->month-1)) && $y_archive->posts):?>
                            <a href="<?php echo get_month_link($year, $y_archive->month)?>"><?php _e($month, 'flotheme') ?></a>
                            <?php if ($key != 11 && $delim):?>
                                <span class="delim"><?php echo $delim; ?></span>
                            <?php endif;?>
                            <?php break;?>
                        <?php endif;?>
                    <?php endforeach;?>
                    <?php if ($key != $y_archive->month-1):?>
                        <span><?php _e($month, 'flotheme') ?></span>
                        <?php if ($key != 11 && $delim):?>
							<span class="delim"><?php echo $delim; ?></span>
                        <?php endif;?>
                    <?php endif;?>
                <?php endforeach;?>
                </div>
            <?php endforeach;?>
        </div>
    </div>
<?php
}

/**
 * Add combined actions for AJAX.
 * 
 * @param string $tag
 * @param string $function_to_add
 * @param integer $priority
 * @param integer $accepted_args 
 */
function flo_add_ajax_action($tag, $function_to_add, $priority = 10, $accepted_args = 1) {
	add_action('wp_ajax_' . $tag, $function_to_add, $priority, $accepted_args);
	add_action('wp_ajax_nopriv_' . $tag, $function_to_add, $priority, $accepted_args);
}

/**
 * Get contact form 7 from content
 * @param string $content
 * @return string 
 */
function flo_contact7_form($content) {
	$matches = array();
	preg_match('~(\[contact\-form\-7.*\])~simU', $content, $matches);
	return $matches[1];
}

/**
 * Remove contact form from content
 * @param string $content
 * @return string
 */
function flo_remove_contact7_form($content) {
	$content = preg_replace('~(\[contact\-form\-7.*\])~simU', '', $content);
	return $content;
}

/**
 * Check if it's a blog page
 * @global object $post
 * @return boolean 
 */
function flo_is_blog () {
	global  $post;
	$posttype = get_post_type($post);
	return ( ((is_archive()) || (is_author()) || (is_category()) || (is_home()) || (is_single()) || (is_tag())) && ($posttype == 'post')) ? true : false ;
}