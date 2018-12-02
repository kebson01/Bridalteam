<?php 
/**
 * Template Name: Template Image Left
 */
get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="image-left cf">
			<figure>
				<?php
					add_filter('the_content', 'flo_parse_first_image', 1);
					the_content();
					remove_filter('the_content', 'flo_parse_first_image', 1);
				?>
			</figure>
			<section class="story">
				<?php
					add_filter('the_content', 'flo_remove_first_image', 1);
					the_content();
					remove_filter('the_content', 'flo_remove_first_image', 1);
				?>
			</section>
		</section>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php get_footer(); ?>