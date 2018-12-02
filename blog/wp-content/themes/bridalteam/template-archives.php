<?php 
/**
 * Template Name: Template Archives
 */
get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="story archives">
			<?php the_content();?>
			<section class="latest">
				<h3><?php _e('The last 30 Posts', 'flotheme')?></h3>
				<ul>
					<?php
						$query = new WP_Query(array(
							'posts_per_page' => 30,
						));
					?>
					<?php if ( $query->have_posts() ) : while ( $query->have_posts() ) : $query->the_post(); ?>
						<li><a href="<?php the_permalink() ?>"><?php the_title(); ?></a> - Posted on <?php the_time('j F Y') ?> - Comments (<?php echo $post->comment_count ?>)</li>
					<?php endwhile; endif; ?>	
				</ul>
			</section>
			
			<section class="by">
				<h4><?php _e('Archives by Month', 'flotheme')?></h4>
				<ul>
					<?php wp_get_archives(array(
						'type'  => 'monthly'
					)); ?>
				</ul>
			</section><section class="by">
				<h4><?php _e('Archives by Category', 'flotheme')?></h4>
				<ul>
					<?php wp_list_categories(array(
						'title_li' => false,
					)); ?>
				</ul>
			</section>
		</section>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php get_footer(); ?>