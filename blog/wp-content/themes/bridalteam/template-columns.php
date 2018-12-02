<?php 
/**
 * Template Name: Template Columns
 */
get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_page_title(get_the_title()) ?>
	<article <?php post_class(); ?> id="page-<?php the_ID()?>" data-page-id="<?php the_ID()?>">
		<section class="story columns">
			<?php the_content();?>
		</section>
	</article>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php get_footer(); ?>