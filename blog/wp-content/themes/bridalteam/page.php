<?php get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="story">
			<?php flo_page_title(get_the_title()) ?>
			<?php the_content();?>
		</section>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php get_footer(); ?>