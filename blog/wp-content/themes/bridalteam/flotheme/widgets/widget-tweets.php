<?php
/*
 * Widget class.
 */
class Flotheme_Tweets_Widget extends WP_Widget 
{
	public $cache_key;
	
	/**
	 * General Setup 
	 */
	public function __construct() 
	{
		/* Widget settings. */
		$widget_ops = array(
			'classname' => 'flo_tweet_widget',
			'description' => __('A widget that displays your latest tweets.', 'flotheme')
		);

		/* Widget control settings. */
		$control_ops = array(
			'width' => 300, 
			'height' => 350, 
			'id_base' => 'flo_tweet_widget'
		);

		/* Create the widget. */
		$this->WP_Widget(
			'flo_tweet_widget', 
			__('Flotheme Latest Tweets','flotheme'), 
			$widget_ops, 
			$control_ops 
		);
		
		$this->cache_key = 'flothemetwittrcache';
	}

	/**
	 * Display Widget
	 * @param array $args
	 * @param array $instance 
	 */
	public function widget( $args, $instance ) 
	{
		extract( $args );
		$title = apply_filters('widget_title', $instance['title'] );
		
		$flo_twitter_username = $instance['username'];
		$flo_twitter_postcount = $instance['postcount'];
		$flo_tweettext = $instance['tweettext'];
		
		echo $before_widget;

		// Display widget title
		if ( $title ) {
			echo $before_title . $title . $after_title;
		}
		
		$tweets = $this->_getTweets($flo_twitter_username, $flo_twitter_postcount);

		?>
		<div class="flotheme-tweets-widget">
		<?php foreach ($tweets as $tweet) : ?>
			<p class="tweet">
				<?php echo $tweet['tweet']?>
				<span class="date"><?php echo $tweet['date']?></span>
			</p>
		<?php endforeach; ?>
		<?php if ($flo_tweettext) : ?>
            <p class="follow">
				<a href="http://twitter.com/#!<?php echo $flo_twitter_username; ?>" rel="external"><?php echo $flo_tweettext; ?></a>
			</p>
		<?php endif;?>
		</div>
		<?php
		/* After widget (defined by themes). */
		echo $after_widget;
	}

	/**
	 * Update Widget
	 * @param array $new_instance
	 * @param array $old_instance
	 * @return array 
	 */
	public function update( $new_instance, $old_instance ) 
	{
		$instance = $old_instance;

		$instance['title'] = strip_tags( $new_instance['title'] );
		$instance['username'] = strip_tags( $new_instance['username'] );
		$instance['postcount'] = intval( $new_instance['postcount'] );
		$instance['tweettext'] = strip_tags( $new_instance['tweettext'] );

		wp_cache_delete($this->cache_key);
		
		return $instance;
	}
	
	/**
	 * Widget Settings
	 * @param array $instance 
	 */
	public function form( $instance ) 
	{
		/* Set up some default widget settings. */
		$defaults = array(
		'title' => 'Latest Tweets',
		'username' => 'flothemes',
		'postcount' => '5',
		'tweettext' => 'Follow on Twitter',
		);
		$instance = wp_parse_args( (array) $instance, $defaults ); ?>

		<!-- Widget Title: Text Input -->
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'flotheme') ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo $instance['title']; ?>" />
		</p>

		<!-- Username: Text Input -->
		<p>
			<label for="<?php echo $this->get_field_id( 'username' ); ?>"><?php _e('Twitter Username e.g. flothemes', 'flotheme') ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'username' ); ?>" name="<?php echo $this->get_field_name( 'username' ); ?>" value="<?php echo $instance['username']; ?>" />
		</p>
		
		<!-- Postcount: Text Input -->
		<p>
			<label for="<?php echo $this->get_field_id( 'postcount' ); ?>"><?php _e('Number of tweets (max 20)', 'flotheme') ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'postcount' ); ?>" name="<?php echo $this->get_field_name( 'postcount' ); ?>" value="<?php echo $instance['postcount']; ?>" />
		</p>
		
		<!-- Tweettext: Text Input -->
		<p>
			<label for="<?php echo $this->get_field_id( 'tweettext' ); ?>"><?php _e('Follow Text e.g. Follow me on Twitter', 'flotheme') ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'tweettext' ); ?>" name="<?php echo $this->get_field_name( 'tweettext' ); ?>" value="<?php echo $instance['tweettext']; ?>" />
		</p>
		
	<?php
	}
	
	protected function _getTweets($flo_twitter_username, $flo_twitter_postcount) 
	{
		
		$tweets = wp_cache_get($this->cache_key);
		
		if (!$tweets) {
			$tweets = flo_get_tweets($flo_twitter_username, $flo_twitter_postcount);

			foreach ($tweets as $k => $t) {
				$tweet = " ".substr(strstr($t['descr'],': '), 2, strlen($t['descr']))." ";
				$tweet = flo_twitter_hyperlinks($tweet);
				$tweet = flo_twitter_users($tweet);		
				$tweets[$k]['tweet'] = $tweet;
			}

			wp_cache_set($this->cache_key, $tweets);
		}
		
		return $tweets;
	}
}
