<?php 
	global $_wedfolio, $wp_query;
	get_header(); 
?>

<div id="container" class="wedfolio">
	<?php if (!get_query_var('paged')) : ?>
		<article class="item welcome">
			<a href="<?php echo home_url('wedfolio'); ?>"><h2>Wedfolio</h2>
			<h3>Boards</h3></a>

			<?php $wedcats = get_categories(array('taxonomy' => 'wedfolio-category', 'hide_empty' => true)); ?>
			<ul class="wedcats">
				<?php $i=1; foreach ($wedcats as $wc) : ?>
					<li class="cat-item gradient<?php echo $i; ?>"><a href="<?php echo get_term_link( $wc, 'wedfolio-category' ); ?>"><?php echo $wc->name; ?></a></li>
				<?php $i++; endforeach; ?>
			</ul>
		</article>
	
		<?php if ( is_user_logged_in() ) : ?>
		<article class="item welcome myfolio <?php if (isset($_REQUEST['my'])) : ?>active<?php endif; ?>">
			<h2><a href="<?php echo home_url('wedfolio'); ?>?my">My Folio</h2>
		</article>
		<?php endif; ?>
	<?php endif; ?>

	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<?php flo_part('wedfolio-loop'); ?>
	<?php endwhile; else: ?>
		<div class="item not-found"><?php flo_part('notfound')?></div>
	<?php endif; ?>
	<?php flo_page_links();?>

	<div class="cf"></div>
</div>

<?php flo_part('masonry-centered-js'); ?>

<?php get_footer(); ?>