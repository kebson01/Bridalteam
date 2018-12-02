<?php 
/**
 * Template Name: Template About
 */
get_header(); ?>
<div id="about">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="story">
			<div class="thumb"><?php the_post_thumbnail(); ?></div>
			<?php the_content();?>
		</section>
		<?php 
			$args = array(
				'post_type' => 'page', 
				'post_parent' => get_the_ID(),
				);
			$subpages = get_posts($args); 
		?>
		<?php if ($subpages) : ?>
		<?php foreach ($subpages as $subpage) : ?>
		<section class="what-we-do">
			<h2><?php echo $subpage->post_title; ?></h2>
			<?php echo wpautop( $subpage->post_content ); ?>
			<a href="<?php echo home_url('contact'); ?>" class="stay">stay in touch</a>
		</section>
		<?php endforeach; ?>
		<?php endif; ?>


		<div class="cf"></div>

		<?php 
			$args = array(
				'post_type' => 'about-history',
				'post_status' => 'publish',
				'orderby' => 'menu_order',
				'order'	=> 'ASC',
				'numberposts' => -1
			);
			$history = get_posts($args); 
		?>
		<?php if($history) : ?>
		<section class="our-history">
			<h2>OUR HISTORY</h2>
			<div class="flexslider">
				<div class="slides">
					<li>
					<?php $i=1; foreach ($history as $story) : ?>
						<?php if ($i%6==0) : ?></li><li><?php $i=1; endif;  ?>
						<div class="block">
							<?php $title = explode('-',$story->post_title); ?>
							<h3><?php echo $title[0]; ?><span>-</span><span class="m"><?php echo $title[1]; ?></h3>
							<div class="thumb">
								<?php echo get_the_post_thumbnail( $story->ID ); ?>
								<?php echo strip_tags($story->post_content); ?>	
							</div>												
						</div>
					<?php $i++; endforeach; ?>					
					</li>
				</div>
			</div>
		</section>

		<script>
		$(window).load(function(){
			$('.flexslider').flexslider({
				animationLoop: false,
				animation: 'slide',
				minItems: 5,
				controlNav: false
			});
		});
		</script>
		
		<?php endif; ?>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
</div>
<?php get_footer(); ?>