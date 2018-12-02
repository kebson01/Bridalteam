<?php
define('FLO_SERVICES_FORM_ID', 2);
define('FLO_VENDOR_APP_FORM_ID', 4);
define('FLO_CONTACT_FORM_ID', 9);

function flo_services_after_submission($entry, $form) {

	// var_dump($entry);
	// var_dump($form);
	// die;

	// 20 = package_1
	// 21 = package_2
	// 22 = package_3
	// 23 = custom
	// $field[24] = package_custom	

	if ( $entry[24] == 'package_custom' )  {
		
	}
}
add_action('gform_after_submission_'.FLO_SERVICES_FORM_ID, 'flo_services_after_submission', 10, 2);


function flo_vendorapp_after_submission($entry, $form) {
}
add_action('gform_after_submission_'.FLO_VENDOR_APP_FORM_ID, 'flo_vendorapp_after_submission', 10, 2);


function flo_contact_after_submission($entry, $form) {
	global $mysubscribe2;
	$checkbox = $entry['6.1']; //Subscribe to our Blog
	$email = $entry[4]; 
	// var_dump($mysubscribe2);
	// var_dump($checkbox, $email);

	if ($checkbox != '' && $email != '') {
		// echo "Should be subscribed";
		if ( is_object($mysubscribe2) ) {
			$mysubscribe2->add($email);
			$mysubscribe2->toggle($email);
		}		
	}
}
add_action('gform_after_submission_'.FLO_CONTACT_FORM_ID, 'flo_contact_after_submission', 10, 2);


// add_filter("gform_pre_render", "flo_pre_render");
// function flo_pre_render($form) {
// 	if ($form['id'] == 3) {
// 		// var_dump($form); 
// 	}

// 	return $form;
// }