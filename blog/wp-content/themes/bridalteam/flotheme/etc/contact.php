<?php
class Flotheme_WP_Mail_From
{
	protected $name;
	
	protected $email;
	
	public function __construct($name = '', $email = '') {
		$this->setEmail($email)->setName($name);
		
	}
	
	public function setEmail($value) {
		$this->email = $value;
		return $this;
	}
	
	public function setName($value) {
		$this->name = $value;
		return $this;
	}
	
	public function filterEmailFrom($content_type) {
		return $this->email;
	}

	public function filterNameFrom($name) {
		return $this->name;
	}
	
	public function addFilters()
	{
		add_filter('wp_mail_from', array($this, 'filterEmailFrom'));
		add_filter('wp_mail_from_name', array($this, 'filterNameFrom'));
		
		return $this;
	}
}
$flo_mail_from = new Flotheme_WP_Mail_From();

/**
 * Send Contact Message
 * 
 * @param array $data
 * @return mixed
 * @throws Exception 
 */
function flo_send_contact($data) {
	$return = true;
	
	try {
		
		if (!wp_verify_nonce($_REQUEST['_wpnonce'])) {
			throw new Exception('Something went wrong. Please refresh the page and try again.');
		}
		
		foreach ($data as $k => $val) {
			$data[$k] = wp_filter_nohtml_kses(trim($val));
		}
		
		if (!$data['name']) {
			throw new Exception('Please enter your name.');
		}
		if (!is_email($data['email'])) {
			throw new Exception('Please enter a valid email address.');
		}
		if (!$data['message']) {
			throw new Exception('Please enter your message.');
		}
		
		do_action('flo_contact_form_send', $data);
		
		$redirectUrl = get_permalink();
		$redirectUrl = substr_count($redirectUrl, '?') ? '&success' : '?success';
		wp_redirect($redirectUrl);
		exit;
		
		
	} catch (Exception $e) {
		$return = array(
			'error' => 1,
			'msg'   => __($e->getMessage(), 'flotheme'),
		);
	}
	
	return $return;
}


/**
 * Send Contact Form Email
 * 
 * @param array $data 
 */
function flo_contact_email_send($data) {
	global $flo_mail_from;
	try {
		$blog = get_bloginfo('name');

		$subject = 'New contact message from ' . $blog;
		$body = "
			Name: {$data['name']}

			Email: {$data['email']}

			Phone: {$data['phone']}

			How did you find me: {$data['how']}


			Message:

			{$data['message']}



			------------


			Sent from {$blog}
		";

		$flo_mail_from->setName($data['name'])->setEmail($data['email'])->addFilters();
			
		wp_mail(get_option('admin_email'), $subject, $body);
	} catch (Exception $e) {
		
	}
}
add_action('flo_contact_form_send', 'flo_contact_email_send');

/**
 * Send Tave information
 * @param array $data 
 */
function flo_contact_tave_send($data) {
	if (flo_get_option('tave_enabled')) {
		$key = flo_get_option('tave_key');
		$studio_id = flo_get_option('tave_studio');
		list($f_name, $l_name) = explode(' ', $data['name'], 2);
		
		$url = "https://my.tave.com/WebService/CreateLead/{$studio_id}";
		
		$tave_data = array(
			'SecretKey'		=> $key,
			'FirstName'		=> $f_name,
			'LastName'		=> $l_name,
			'Email'			=> $data['email'],
			'Source'		=> $data['how'],
			'Message'		=> $data['message'],
			'MobilePhone'	=> $data['phone'],
		);

		$channel = curl_init();

		curl_setopt($channel, CURLOPT_URL, $url);
		curl_setopt($channel, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($channel, CURLOPT_POST, true);
		curl_setopt($channel, CURLOPT_POSTFIELDS, $tave_data);
		curl_setopt($channel, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($channel, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($channel, CURLOPT_CONNECTTIMEOUT, 10);
		curl_setopt($channel, CURLOPT_TIMEOUT, 20);
		/* get the response from the Tave API */
		$response = trim(curl_exec($channel));
		$httpcode = curl_getinfo($channel, CURLINFO_HTTP_CODE);

		if (curl_errno($channel) == 0 && $httpcode == 200 && $response == 'OK') {
			// success
		} else {
			// errror
		}
		curl_close($channel);
	}
}
add_action('flo_contact_form_send', 'flo_contact_tave_send');

/**
 * Send ShootQ information
 * @param array $data
 */
function flo_contact_shootq_send($data) {
	
	if (flo_get_option('shootq_enabled')) {
		list($f_name, $l_name) = explode(' ', $data['name'], 2);
		
		$api = flo_get_option('shootq_api');
		$abbr = flo_get_option('shootq_abbr');
		
		$url = "https://app.shootq.com/api/{$abbr}/leads";
		
		$shootq_data = array(
			'api_key'	=> $api,
			'contact'   => array(
				'first_name'    => $f_name,
				'last_name'     => $l_name,
				'phones'        => array(
					array(
						'type'      => 'Home',
						'number'    => $data['phone'],
					)
				),
				'emails'        => array(
					array(
						'type'      => 'Home',
						'email'     => $data['email'],
					)
				)
			),
			'event'     => array(
				'type'          => 'Wedding',
				'remarks'       => nl2br($data['message']),
				'extra'     => array(
					'Preferred Date'    =>  $data['date'],
					'Type'              => $data['type'],
				)
			),
		);
		
		$json_data = json_encode($shootq_data);

		/* send this data to ShootQ via the API */
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, Array("Content-Type: application/json"));
		curl_setopt($ch, CURLOPT_POST, TRUE);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

		curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);

		$response_json = curl_exec($ch);
		$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$response = json_decode($response_json);

		if (curl_errno($ch) == 0 && $httpcode == 200) {
			curl_close($ch);
		} else {
			curl_close($ch);
			throw new Exception(__('Cannot send mail. Please check all fields', 'flotheme'));
		}
	}
}
add_action('flo_contact_form_send', 'flo_contact_shootq_send');