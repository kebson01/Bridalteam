<?php
/**
 * Blog Widget 
 */
class Flotheme_Blog_Widget extends WP_Widget 
{
	/**
	 * General Setup 
	 */
	public function __construct() {
	
		/* Widget settings. */
		$widget_ops = array(
			'classname' => 'flo_blog_widget', 
			'description' => __('A widget that displays your latest posts with image.', 'flotheme') 
		);

		/* Widget control settings. */
		$control_ops = array(
			'width'		=> 300, 
			'height'	=> 350, 
			'id_base'	=> 'flo_blog_widget' 
		);

		/* Create the widget. */
		$this->WP_Widget( 'flo_blog_widget', __('Flotheme Recent Posts', 'flotheme'), $widget_ops, $control_ops );
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

		/* Our variables from the widget settings. */
		$number = $instance['number'];

		/* Before widget (defined by themes). */
		echo $before_widget;

		// Display Widget
		?> 
        <?php /* Display the widget title if one was input (before and after defined by themes). */
				if ( $title )
					echo $before_title . $title . $after_title;
				?>
			<div class="flotheme-blog-widget">
                <ul class="cf">
                
					<?php 
                    $query = new WP_Query(array(
						'posts_per_page'		=> $number,
						'ignore_sticky_posts'	=> 1,
					));
                    ?>
                    <?php if ($query->have_posts()) : while ($query->have_posts()) : $query->the_post(); ?>
						<?php  $image = flo_get_og_meta_image(); ?>
						<?php if ($image) : /* if post has post thumbnail */ ?>
						<li class="cf">
							<div class="entry-thumb"><a href="<?php the_permalink(); ?>"><img src="<?php echo $image?>" alt="" /></a></div>
						<?php else:?>
							<li class="cf no-thumb">
						<?php endif; ?>
							<div class="detail">
								<h4 class="entry-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h4>
								<span class="entry-meta"><?php the_time(get_option('date_format')); ?></span>
							</div>
						</li>
                    <?php endwhile; endif; ?>
                    
                    <?php wp_reset_query(); ?>

                </ul>
                
            </div><!--blog_widget-->
		
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
		$instance['number'] = strip_tags( $new_instance['number'] );

		return $instance;
	}
	
	/**
	 * Widget Settings
	 * @param array $instance 
	 */
	public function form( $instance ) 
	{
		//default widget settings.
		$defaults = array(
			'title' => __('Latest Blog Posts', 'flotheme'),
			'number' => 4
		);
		$instance = wp_parse_args( (array) $instance, $defaults ); ?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e('Title:', 'flotheme') ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" value="<?php echo $instance['title']; ?>" />
		</p>
		<p>
			<label for="<?php echo $this->get_field_id( 'number' ); ?>"><?php _e('Posts to show:', 'flotheme') ?></label>
			<input type="text" class="widefat" id="<?php echo $this->get_field_id( 'number' ); ?>" name="<?php echo $this->get_field_name( 'number' ); ?>" value="<?php echo $instance['number']; ?>" />
		</p>
	<?php
	}
}