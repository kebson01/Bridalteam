<?php
/**
 * Adding our custom fields to the $form_fields array
 *
 * @param array $form_fields
 * @param object $post
 * @return array
 */
function flo_attachment_fields_to_edit($form_fields, $post) {
	
	$val = get_post_meta($post->ID, "_flo_hide_from_gallery", true);
	$checked = $val ? 'checked="checked"' : '';
	$form_fields["hide_from_gallery"] = array(
		"label" => __("Hide", 'flotheme'),
		"input" => "html",
		'html'	=> "<label><input type='hidden' name='attachments[{$post->ID}][hide_from_gallery]' value='0' /><input type='checkbox' value='1' {$checked} name='attachments[{$post->ID}][hide_from_gallery]' id='attachments[{$post->ID}][hide_from_gallery]' /> Don't display image in gallery.</label>",
		"value" => $val,
	);
		
	if (function_exists('flotheme_media_custom_fields')) {
		foreach (flotheme_media_custom_fields() as $field) {
			$data = array();
			$data['value'] = $val = get_post_meta($post->ID, '_flo_' . $field['name'], true);
			$data['label'] = __($field['label'], 'flotheme');
			if (isset($field['help'])) {
				$data['helps'] = $field['help'];
			}
			if (isset($field['extra'])) {
				$data['extra_rows'] = $field['extra'];
			}
			switch ($field['type']) {
				case 'text':
				case 'textarea':
					$data['input'] = $field['type'];
					break;
				
				case 'checkbox':
					$data['input'] = 'html';
					$data['html'] = '<label><input type="checkbox" value="1" ' . ($data['value'] ? 'checked="checked"' : '') . ' name="attachments[' . $post->ID . '][' . $field['name'] . ']" id="attachments[' . $post->ID . '][' . $field['name'] . ']" />';
					break;
				
				case 'select':
					$data['input'] = 'html';
					$data['html'] = '<select name="attachments[' . $post->ID . '][' . $field['name'] . ']" id="attachments[' . $post->ID . '][' . $field['name'] . ']">';
					foreach ($field['options'] as $val => $lbl) {
						$data['html'] .= '<option value="' . $val . '" ' . ($data['value'] == $val ? 'selected="selected"' : '') . '>' . $lbl . '</option>';
					}
					$data['html'] .= '</select>';
					break;
				
				case 'html':
					$data['input'] = 'html';
					$data['html'] = $field['html'];
					break;
			}
			
			$form_fields[$field['name']] = $data;
		}
	}
	
	return $form_fields;
}
// attach our function to the correct hook
add_filter("attachment_fields_to_edit", "flo_attachment_fields_to_edit", null, 2);

/**
 * Add meta key for galleries right after upload
 * 
 * @param integer $attachment_ID 
 */
function flo_analyse_attachment($post_id) {
    update_post_meta($post_id, '_flo_hide_from_gallery', 0);
}
add_action("add_attachment", 'flo_analyse_attachment');

/** 
 * Save image custom fields
 * 
 * @param array $post 
 * @param array $attachment 
 * @return array 
 */  
function flo_attachment_fields_to_save($post, $attachment) {
	update_post_meta($post['ID'], '_flo_hide_from_gallery', isset($attachment['hide_from_gallery']) ? (int) $attachment['hide_from_gallery'] : 0);
	
	if (function_exists('flotheme_media_custom_fields')) {
		foreach (flotheme_media_custom_fields() as $field) {
			
			$value = $attachment[$field['name']];
			switch ($field['type']) {
				case 'checkbox':
					$value = (int) $value;
					break;
				case 'select':
					$keys = array_keys($field['options']);
					if (!in_array($value, $keys)) {
						$value = $keys[0];
					}
					break;
				default:
					$value = trim($value);
					break;
			}
			update_post_meta($post['ID'], '_flo_' . $field['name'], $value);
		}
	}
	
    return $post;  
} 
add_filter("attachment_fields_to_save", "flo_attachment_fields_to_save", null, 2);


/**
 * Remove settings div in gallery.
 * Disable inserting gallery in the post.
 */
function flo_remove_gallery_setting_div() {
	print '
		<style type="text/css">
			#gallery-settings,
			#gallery-settings *{
				display:none;
			}
		</style>';
}
add_action( 'admin_head_media_upload_gallery_form', 'flo_remove_gallery_setting_div' );


/**
 * Add the Gallery Metabox
 */
function flo_gallery_metabox_add() {

	if (function_exists('flotheme_get_post_types_with_gallery')) {
		$post_types = flotheme_get_post_types_with_gallery();
	} else {
		$post_types = array('post', 'page');
	}
	$post_types = apply_filters( 'flo_gallery_metabox_post_types', $post_types);
	$context = apply_filters( 'flo_gallery_metabox_context', 'normal' );
	$priority = apply_filters( 'flo_gallery_metabox_priority', 'high' );
	
	// Loop through all post types
	foreach ($post_types as $post_type) {
		// Get post ID
		if(isset( $_GET['post']))  {
			$post_id = $_GET['post'];
		} elseif(isset($_POST['post_ID'])) {
			$post_id = $_POST['post_ID']; 
		}
		if(!isset($post_id)) {
			$post_id = false;
		}
		
		if( apply_filters( 'flo_gallery_metabox_limit', true, $post_id ) ) {
			add_meta_box( 'flo_gallery_metabox', __( 'Gallery Images', 'gallery-metabox' ), 'flo_gallery_metabox', $post_type, $context, $priority );
		}
	}
}
add_action( 'add_meta_boxes', 'flo_gallery_metabox_add' );

/**
 * Build metabox
 * 
 * @param object $post
 */
function flo_gallery_metabox( $post ) {
	
	$original_post = $post;
	echo flo_gallery_metabox_html($post->ID);
	$post = $original_post;
}

/** 
 * Gallery Metabox 
 * 
 * @param int $post_id
 * @return string html output
 */
function flo_gallery_metabox_html($post_id) {
	$args = array(
		'post_type'			=> 'attachment',
		'post_status'		=> 'inherit',
		'post_parent'		=> $post_id,
		'post_mime_type'	=> 'image',
		'posts_per_page'	=> '-1',
		'order'				=> 'ASC',
		'orderby'			=> 'menu_order',
		'meta_query'		=> array(
			array(
				'key'		=> '_flo_hide_from_gallery',
				'value'		=> 0,
				'type'		=> 'DECIMAL',
			),
		),
	);
	
	$args = apply_filters( 'flo_gallery_metabox_args', $args );
	$return = '';
	
	$intro = '<p><a href="media-upload.php?post_id=' . $post_id .'&amp;type=image&amp;TB_iframe=1&amp;width=640&amp;height=715" id="add_image" class="thickbox" title="' . __( 'Add Image', 'flotheme' ) . '">' . __( 'Upload Images', 'flotheme' ) . '</a> | <a href="media-upload.php?post_id=' . $post_id .'&amp;type=image&amp;tab=gallery&amp;TB_iframe=1&amp;width=640&amp;height=715" id="manage_gallery" class="thickbox" title="' . __( 'Manage Gallery', 'flotheme' ) . '">' . __( 'Manage Gallery', 'flotheme' ) . '</a></p>';
	$return .= apply_filters( 'flo_gallery_metabox_intro', $intro);

	$loop = get_posts($args);
	if (empty($loop)) {
		return '<p>Gallery is empty.</p>';
	}
	
	foreach ($loop as $image) {
		$thumbnail = wp_get_attachment_image_src($image->ID, apply_filters('flo_gallery_metabox_image_size', 'thumbnail'));
		$return .= apply_filters('flo_gallery_metabox_output', '<img src="' . $thumbnail[0] . '" alt="' . $image->post_title . '" title="' . $image->post_content . '" /> ', $thumbnail[0], $image );
	}
	
	return $return;
}

/**
 * Metabox AJAX update
 * 
 * @param object $form_fields
 * @param object $post
 */
function flo_gallery_metabox_do_ajax_update( $form_fields, $post ) {
	$js = '<script type="text/javascript">
	    <![CDATA[
	    jQuery.ajax({
		    url: "' . admin_url('admin-ajax.php') . '",
		    type: "POST",
		    data: "action=refresh_metabox&post_id=<?php echo $post->post_parent; ?>&current_post_id=" + jQuery(\'#post_ID\', top.document).val(),
		    success: function(res) {
				jQuery(\'#flo_gallery_metabox .inside\', top.document).html(res);
		    },
		    error: function(request, status, error) {}
	   });
	   ]]>
    </script>';
	$form_fields['hide_from_gallery']['html'] .= $js;
	return $form_fields;
}
add_filter( 'attachment_fields_to_edit', 'flo_gallery_metabox_do_ajax_update', 10, 2 );

/**
 * Refresh metabox content 
 */
function flo_gallery_metabox_ajax_update() {
	if (!empty($_POST['current_post_id'])) {
		die(flo_gallery_metabox_html($_POST['current_post_id']));
	}
}
add_action( 'wp_ajax_refresh_metabox', 'flo_gallery_metabox_ajax_update' );