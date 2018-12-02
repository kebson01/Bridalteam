<?php get_header(); ?>

<div id="gallery" class="content">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<div class="description">
			<a href="<?php echo home_url('gallery'); ?>" class="back">BACK TO PORTFOLIO</a>

			<h2><?php the_title(); ?></h2>
			<h3><?php the_terms(get_the_ID(), 'gallery-category', '', ', '); ?></h3>

			<div class="info">
				<?php the_terms(get_the_ID(), 'gallery-location', '<div>Location: ', ' ', '</div>'); ?>
				<?php the_terms(get_the_ID(), 'gallery-colors', '<div>Colors: ', ' ', '</div>'); ?>
			</div>

			<?php the_content(); ?>
		</div>

		<?php $images = flo_get_attached_images(get_the_ID(), false); ?>
		<div class="photos">
			<div id="slider" class="flexslider">
			  <ul class="slides">
				<?php foreach ($images as $img) : ?>
					<li><?php echo flo_wrap_images_credits(wp_get_attachment_image($img->ID, 'full')); ?></li>
				<?php endforeach; ?>
			  </ul>
			</div>
			<div class="bottom">
				<div id="carousel" class="flexslider">
				  <ul class="slides">
					<?php foreach ($images as $img) : ?>
						<li><?php echo wp_get_attachment_image($img->ID, 'full'); ?></li>
					<?php endforeach; ?>
				  </ul>
				</div>				
				
				<div class="share">
					<label for="">Share</label>

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

				<div class="cf"></div>
			</div>
		</div>

		<script>
			$(window).load(function() {
			  $('#carousel').flexslider({
			    animation: "slide",
			    controlNav: false,
			    animationLoop: false,
			    slideshow: false,
			    itemWidth: 110,
			    itemMargin: 15,
			    asNavFor: '#slider'
			  });
			   
			  $('#slider').flexslider({
			    animation: "slide",
			    controlNav: false,
			    animationLoop: false,
			    slideshow: false,
			    keyboard: true,
				multipleKeyboard: true,  
			    sync: "#carousel"
			  });
			});
		</script>

		<div class="cf"></div>

		<?php $args = array(
				'numberposts' => 4,
				'post_type' => 'gallery',				
				'post_status' => 'publish'
			);
			$related_galleries = get_posts($args); 
		?>
		<?php if (!empty($related_galleries)) : ?>
		<div id="related">
			<label for="">Related <span>Galleries</span></label>	
			<?php foreach($related_galleries as $rg) :?>
			<li>
				<div class="thumb"><a href="<?php echo get_permalink($rg->ID); ?>"><?php echo flotheme_show_post_cover($rg->ID); ?></a></div>
				<div class="bottom">
					<a href="<?php echo get_permalink($rg->ID); ?>"><h3><?php echo $rg->post_title; ?></h3></a>
				</div>
			</li>
			<?php endforeach; ?>
		</div>
		<?php endif; ?>
	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>
</div>

<div class="cf"></div>
<?php get_footer(); ?>