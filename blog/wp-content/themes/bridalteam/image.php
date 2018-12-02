<?php get_header(); ?>
<div id="attachment">
	<?php flo_page_title('<a href="' . get_permalink($post->post_parent) . '" rev="attachment">' . get_the_title($post->post_parent) . '</a>') ?>
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<?php flo_part('posthead');?>
		<header>
			<h3><?php the_title(); ?></h3>
		</header>
		<section class="full">
			<section class="story cf">
				<p>
					<a href="<?php echo wp_get_attachment_url($post->ID); ?>"><?php echo wp_get_attachment_image( $post->ID, 'full' ); ?></a>
				</p>
				<?php the_content(); ?>
			</section>
		</section>
		<footer>
			<nav class="prev-next-links cf">
				<span class="prev"><?php previous_image_link() ?></span>
				<span class="next"><?php next_image_link() ?></span>
			</nav>
		</footer>
		<?php flo_part('postfooter');?>
	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>
	<?php flo_part('archives'); ?>
</div>
<?php get_footer(); ?>