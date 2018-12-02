<?php get_header(); ?>

<div id="container" class="wedfolio search">
	<?php if (!get_query_var('paged')) : ?>

		<article class="item">
			<?php flo_page_title(sprintf( __( 'Search Results for: %s', 'flotheme' ), '<span>' . get_search_query() . '</span>' )) ?>
		</article>

	<?php endif; ?>

	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

		<?php if ( 'wedfolio' == get_post_type(get_the_ID()) ) : ?>
			<?php flo_part('wedfolio-loop'); ?>
		<?php else: ?>
			<article <?php post_class('item'); ?>>
				<div class="thumb">
					<a href="<?php the_permalink(); ?>"><?php echo flotheme_show_post_cover(get_the_ID()); ?></a>
				</div>
				<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="by-author ta">
						<time pubdate="<?php the_time('c'); ?>"><?php the_time(get_option('date_format'));?></time>
						<span class="sep"><?php _e('by', 'flotheme'); ?></span>
						<span class="author vcard"><?php the_author_posts_link() ?></span>
					</div>
					<div class="categories">
						<?php _e('in', 'flotheme'); ?>
						<?php the_category(', '); ?>
						 | <?php comments_number( '0 comments', '1 comment', '% comments'); ?>
					</div>	
			</article>
		<?php endif; ?>

	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>

	<?php flo_page_links();?>

	<div class="cf"></div>
</div>

<?php flo_part('masonry-centered-js'); ?>

<?php get_footer(); ?>