<?php 
$ajax = (boolean) $_POST['ajax']; 
if ($ajax) :
?>
	<div id="single-wedfolio">
		<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

			<div class="title">
				
				<h2><?php the_title();?></h2>			
				<div class="meta ta">			
					<time pubdate="<?php the_time('c'); ?>"><?php the_time('F d');?></time>
					<span class="by-author ta">
						<span class="sep"><?php _e('by', 'flotheme'); ?></span>
						<span class="author vcard"><?php echo get_the_author(); ?></span>
					</span>
					<span class="categories">
						<?php _e('in', 'flotheme'); ?>
						<?php the_terms(get_the_ID(), 'wedfolio-category', '', ', '); ?>
					</span>
				</div>
			</div>

			<div class="story">
				<?php 
					$image = '<img src="'.get_the_content().'" />';
					global $current_user, $post;
					if ($post->post_author == $current_user->ID) { 
						echo $image;
					} else {
						echo flo_wrap_images_credits($image);	
					}
				?>
				
				
			</div>

			<div class="actions">
				<!-- <h3><?php printf(_n('1 Comment', '%1$s Comments', get_comments_number(), 'flotheme'), number_format_i18n(get_comments_number())); ?></h3>	 -->
				<label for="">share</label>

				<div class="share">
					<span class="fblike">
						<a href="<?php flo_share('fb'); ?>"></a>
					</span>
					<span class="tweet">
						<a href="<?php flo_share('twi'); ?>"></a>
					</span>
					<span class="pinit">
						<a href="<?php flo_share('pin'); ?>"></a>
					</span>		
				</div>		
			</div>

			<?php comments_template(); ?>		
		<?php endwhile; endif; ?>	
	</div>
<?php 
else: 
	wp_redirect( home_url('wedfolio'), $status = 302 ); 	
endif; 
?>