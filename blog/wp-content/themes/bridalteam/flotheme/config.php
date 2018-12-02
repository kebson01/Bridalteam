<?php
/**
 * Get current theme options
 * 
 * @return array
 */
function flotheme_get_options() {

	$options = array();
		
	$options[] = array("name" => "Theme",
						"type" => "heading");
	
	$options[] = array( "name" => "Copyrights",
						"desc" => "Your copyright message.",
						"id" => "flo_copyrights",
						"std" => "",
						"type" => "text");
	
	$options[] = array( "name" => "Social",
						"type" => "heading");
	
	$options[] = array( "name" => "Facebook",
						"desc" => "Your facebook profile URL.",
						"id" => "flo_fb",
						"std" => "",
						"type" => "text");

	$options[] = array( "name" => "Twitter",
						"desc" => "Your twitter username.",
						"id" => "flo_twi",
						"std" => "",
						"type" => "text");


    $options[] = array( "name" => "Twitter: Consumer Key",
                        "desc" => "",
                        "id" => "flo_twi_consumer_key",
                        "std" => "",
                        "type" => "text");    

    $options[] = array( "name" => "Twitter: Consumer Secret",
                        "desc" => "",
                        "id" => "flo_twi_consumer_secret",
                        "std" => "",
                        "type" => "text");    

    $options[] = array( "name" => "Twitter: Access token",
                        "desc" => "",
                        "id" => "flo_twi_access_token",
                        "std" => "",
                        "type" => "text");    

    $options[] = array( "name" => "Twitter: Access token secret",
                        "desc" => "",
                        "id" => "flo_twi_access_token_secret",
                        "std" => "",
                        "type" => "text");                                                        

	$options[] = array( "name" => "Pinterest",
						"desc" => "Your pinterest profile URL.",
						"id" => "flo_pin",
						"std" => "",
						"type" => "text");

	$options[] = array( "name" => "Homepage",
						"type" => "heading");

	$i=1; while($i<=3) :

		$options[] = array( "name" => "B" . $i . " Image",
							"desc" => "Upload your image for block " . $i . " URL.",
							"id" => "flo_block".$i."i",
							"std" => "",
							"type" => "upload");

		$options[] = array( "name" => "B" . $i . " URL",
							"desc" => "Enter block " . $i . " URL.",
							"id" => "flo_block".$i."u",
							"std" => "",
							"type" => "text");
		$i++;
	endwhile;
    $options[] = array( "name" => "Blog",
                        "type" => "heading");   

    $options[] = array( "name" => "Sidebar: Featured Categories",
                        "desc" => "Enter comma delimited category slugs",
                        "id" => "flo_featured_categories",
                        "std" => "monday-mini-series, wednesday-wediquette, feedback-fridays, diy-saturdays, giving-back, giveaways",
                        "type" => "text");  

	$options[] = array( "name" => "Portfolio",
						"type" => "heading");	
	
	$options[] = array( "name" => "Welcome Title",
						// "desc" => "Enter welcome title",
						"id" => "flo_portfolio_welcome_title",
						"std" => "",
						"type" => "text"); 	

	$options[] = array( "name" => "Welcome Text",
						// "desc" => "Enter welcome text",
						"id" => "flo_portfolio_welcome_text",
						"std" => "",
						"type" => "editor"); 		

	$options[] = array( "name" => "Advanced Settings",
						"type" => "heading");
	
	$options[] = array( "name" => "Google Analytics",
						"desc" => "Please insert your Google Analytics code here. Example: <strong>UA-22231623-1</strong>",
						"id" => "flo_ga",
						"std" => "",
						"type" => "text"); 

    $options[] = array( "name" => "Vendors",
                        "type" => "heading");   

    $options[] = array( "name" => "Event Types",
                        "desc" => "enter comma delimited event types here",
                        "id" => "flo_vendor_event_type",
                        "std" => "",
                        "type" => "text");  

    $options[] = array( "name" => "Venue Submit",
                        "type" => "heading");   
    $i=1; while($i<7) {
        $options[] = array( "name" => "Column ".$i,
                            "id" => "flo_venue_column".$i,
                            "std" => "",
                            "type" => "editor");         
        $i++;
    }
	
	return $options;
}

/**
 * Add custom scripts to Options Page
 */
function flotheme_options_custom_scripts() {
 ?>

<script type="text/javascript">
jQuery(document).ready(function() {
	
});
</script>

<?php
}

/**
 * Add Metaboxes
 * @param array $meta_boxes
 * @return array 
 */
function flotheme_metaboxes($meta_boxes) {
	
	$meta_boxes = array();

    $prefix = 'flo_vendor_';

    $meta_boxes[] = array(
        'id'         => 'vendor_metabox',
        'title'      => 'Vendor Metabox',
        'pages'      => array( 'vendor', ), // Post type
        'context'    => 'normal',
        'priority'   => 'high',
        'show_names' => true, // Show field names on the left
        'fields'     => array(
            array(
                'name' => 'Address',
                'id'   => $prefix . 'address',
                'type' => 'text_medium',
            ),
            array(
                'name' => 'Phone',
                'id'   => $prefix . 'phone',
                'type' => 'text_medium',
            ),
            array(
                'name' => 'Email',
                'id'   => $prefix . 'email',
                'type' => 'text_medium',
            ),            
            array(
                'name' => 'Website',
                'id'   => $prefix . 'website',
                'type' => 'text_medium',
            ),    
            array(
                'name' => 'Maximum Capacity',
                'id'   => $prefix . 'capacity',
                'type' => 'text_small',
            ),                    
            array(
                'name' => 'On-site catering',
                'id'   => $prefix . 'onsite_catering',
                'type' => 'checkbox',
            ),            
            array(
                'name' => 'Outside catering',
                'id'   => $prefix . 'outside_catering',
                'type' => 'checkbox',
            ),              
            array(
                'name' => 'Facebook',
                'id'   => $prefix . 'facebook',
                'type' => 'text_medium',
            ),  
            array(
                'name' => 'Twitter',
                'id'   => $prefix . 'twitter',
                'type' => 'text_medium',
            ),          
            array(
                'name' => 'Pinterest',
                'id'   => $prefix . 'pinterest',
                'type' => 'text_medium',
            ),    
            array(
                'name' => 'FAQ',
                'id'   => $prefix . 'faq',
                'type' => 'wysiwyg',
            ),
            array(
                'name' => 'Services',
                'id'   => $prefix . 'services',
                'type' => 'wysiwyg',
            ),            
            array(                            
                'name' => 'Contact Person',
                'desc' => 'enter comma delimited names here',
                'id'   => $prefix . 'contact_person',
                'type' => 'text',
            ),                             
  
        ),
    );

    $prefix = 'flo_wedfolio_';

    $meta_boxes[] = array(
        'id'         => 'wedfolio_metabox',
        'title'      => 'Wedfolio Metabox',
        'pages'      => array( 'wedfolio', ), // Post type
        'context'    => 'normal',
        'priority'   => 'high',
        'show_names' => true, // Show field names on the left
        'fields'     => array(
            array(
                'name' => 'Wedfolio',
                // 'desc' => 'field description (optional)',
                'id'   => $prefix . 'featured',
                'type' => 'checkbox',
            ),
  
        ),
    );

	return $meta_boxes;
}

/**
 * Get image sizes for images
 * 
 * @return array
 */
function flotheme_get_images_sizes() {
	return array();
}

/**
 * Add post types that are used in the theme 
 * 
 * @return array
 */
function flotheme_get_post_types() {
    return array();
	/*return array(        
        'wedfolio' => array(
            'config' => array(
                'public' => true,
                'exclude_from_search' => false,
                'menu_position' => 20,
                'has_archive'   => true,
                'supports'=> array(
                    'title',
                    'editor',
                    'thumbnail',
                    'page-attributes',
                    'comments'
                ),
                'show_in_nav_menus'=> true,
            ),
            'singular' => 'Wedfolio',
            'multiple' => 'Wedfolio',
            'columns'    => array(
                'first_image',
            )
        ),		
        'gallery' => array(
            'config' => array(
                'public' => true,
                'exclude_from_search' => false,
                'menu_position' => 20,
                'has_archive'   => true,
                'supports'=> array(
                    'title',
                    'editor',
                    'thumbnail',
                    'page-attributes',
                ),
                'show_in_nav_menus'=> true,
            ),
            'singular' => 'Gallery',
            'multiple' => 'Galleries',
            'columns'    => array(
                'first_image',
            )
        ),
        'vendor' => array(
            'config' => array(
                'public' => true,
                'exclude_from_search' => false,
                'menu_position' => 20,
                'has_archive'   => true,
                'supports'=> array(
                    'title',
                    'editor',
                    'thumbnail',
                    'page-attributes',
                    'comments'
                ),
                'show_in_nav_menus'=> true,
            ),
            'singular' => 'Vendor',
            'multiple' => 'Vendors',
            'columns'    => array(
                'first_image',
            )
        ),             
        'faq' => array(
            'config' => array(
                'public' => true,
                'exclude_from_search' => true,
                'menu_position' => 20,
                'has_archive'   => true,
                'supports'=> array(
                    'title',
                    'editor',
                    'page-attributes',
                ),
                'show_in_nav_menus'=> true,
            ),
            'singular' => 'QA',
            'multiple' => 'FAQ',
        ),   
        'about-history' => array(
            'config' => array(
                'public' => true,
                'exclude_from_search' => true,
                'menu_position' => 20,
                'has_archive'   => true,
                'supports'=> array(
                    'title',
                    'editor',
                    'thumbnail',
                    'page-attributes',
                ),
                'show_in_nav_menus'=> true,
            ),
            'singular' => 'History',
            'multiple' => 'History',
        ),                         
	);*/
}

/**
 * Add taxonomies that are used in theme
 * 
 * @return array
 */
function flotheme_get_taxonomies() {
	return array(
        'vendor-category'    => array(
            'for'        => array('vendor'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => true,
            ),
            'singular'    => 'Category',
            'multiple'    => 'Categories',
        ),     
        'vendor-location'    => array(
            'for'        => array('vendor'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => false,
            ),
            'singular'    => 'Location',
            'multiple'    => 'Locations',
        ),               
        'wedfolio-category'    => array(
            'for'        => array('wedfolio'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => true,
            ),
            'singular'    => 'Category',
            'multiple'    => 'Categories',
        ),	
        'wedfolio-tag'    => array(
            'for'        => array('wedfolio'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => false,
            ),
            'singular'    => 'Tag',
            'multiple'    => 'Tags',
        ),          	
        'gallery-category'    => array(
            'for'        => array('gallery'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => true,
            ),
            'singular'    => 'Category',
            'multiple'    => 'Categories',
        ),
        'gallery-colors'    => array(
            'for'        => array('gallery'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => false,
            ),
            'singular'    => 'Theme & Colors',
            'multiple'    => 'Theme & Colors',
        ),   
        'gallery-location'    => array(
            'for'        => array('gallery'),
            'config'    => array(
                'sort'        => true,
                'args'        => array('orderby' => 'term_order'),
                'hierarchical' => false,
            ),
            'singular'    => 'Location',
            'multiple'    => 'Locations',
        ),                
	);
}

/**
 * Add post formats that are used in theme
 * 
 * @return array
 */
function flotheme_get_post_formats() {
	return array();
}

/**
 * Get sidebars list
 * 
 * @return array
 */
function flotheme_get_sidebars() {
	$sidebars = array();
	return $sidebars;
}

/**
 * Predefine custom sliders
 * @return array
 */
function flotheme_get_sliders() {
	return array(
		'sneak-peek' => array(
			'title'		=> 'Sneak Peek',
		),
	);
}

/**
 * Post types where metaboxes should show
 * 
 * @return array
 */
function flotheme_get_post_types_with_gallery() {
	return array('post');
}

/**
 * Add custom fields for media attachments
 * @return array
 */
function flotheme_media_custom_fields() {
	return array();
}