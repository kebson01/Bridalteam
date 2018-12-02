<?php get_header(); ?>
<div id="contact">
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="story">
			<div class="thumb"><?php the_post_thumbnail(); ?></div>
			<?php the_content();?>
			<div class="cf"></div>
		</section>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<script>
	$(window).load(function(){
		$('.contact_type').wrapAll('<div id="contact-type" />'); 	
	});
</script>
</div>
<?php get_footer(); ?>