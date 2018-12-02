<?php get_header(); ?>

<div id="container" class="gallery">
	<article class="item welcome">
		<h2>Portfolio</h2>
		<h3><?php flo_option('portfolio_welcome_title'); ?></h3>

		<?php echo wpautop(flo_get_option('portfolio_welcome_text')); ?>
	</article>

	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

		<article <?php post_class('item'); ?>>
			<a href="<?php the_permalink(); ?>"><?php echo flotheme_show_post_cover(get_the_ID()); ?></a>
			
			<div class="info">
				<div class="text">
					<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="categories"><?php the_terms(get_the_ID(), 'gallery-category', '', ', '); ?></div>	
					<div class="location"><?php the_terms(get_the_ID(), 'gallery-location', '', ', '); ?></div>	
				</div>
				<a href="<?php the_permalink(); ?>" class="overlink"></a>
			</div>
		</article>

	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>
	
	<?php flo_page_links();?>

	<div class="cf"></div>
</div>

<?php flo_part('masonry-centered-js'); ?>

<?php get_footer(); ?>