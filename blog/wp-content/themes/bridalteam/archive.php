<?php get_header(); ?>
<?php
	if ( is_day() ) :
			$archive_label = sprintf( __( 'Daily Archives: %s', 'flotheme' ), '<span>' . get_the_date() . '</span>' );
	elseif ( is_month() ) :
			$archive_label = sprintf( __( 'Monthly Archives: %s', 'flotheme' ), '<span>' . get_the_date( _x( 'F Y', 'monthly archives date format', 'flotheme' ) ) . '</span>' );
	elseif ( is_year() ) :
			$archive_label = sprintf( __( 'Yearly Archives: %s', 'flotheme' ), '<span>' . get_the_date( _x( 'Y', 'yearly archives date format', 'flotheme' ) ) . '</span>' );
	else :
		$archive_label = 'Blog Archives';
	endif;
?>

<div id="container">
	<?php if (!get_query_var('paged')) : ?>

		<article class="item">
			<?php flo_page_title($archive_label) ?>
		</article>		

	<?php endif; ?>

	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

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

	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>

	<?php flo_page_links();?>

	<div class="cf"></div>
</div>

<?php flo_part('masonry-centered-js'); ?>

<?php get_footer(); ?>