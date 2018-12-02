<?php get_header(); ?>

<div id="post" class="content">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<?php flo_part('posthead');?>
		<?php flo_part('postpreview' );?>
		<?php flo_part('postfull');?>
		<?php flo_part('postlike');?>
		<?php flo_part('postfooter');?>
	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>
</div>

<?php flo_part('postsidebar'); ?>

<div class="post-links">
	<span class="prev"><?php previous_post_link( '%link','%title', false ); ?></span>
	<span class="next"><?php next_post_link( '%link', '%title', false ); ?></span>
</div>

<script>
	$(document).ready(function(){
		$('.tooltip').tooltipster();
	})
</script>

<div class="cf"></div>
<?php get_footer(); ?>