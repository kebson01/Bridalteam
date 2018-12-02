<?php 
/**
 * Template Name: Template Sitemap
 */
get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="story sitemap">
			<?php the_content();?>
			<section class="box">
				<h3><?php _e('Pages', 'flotheme')?></h3>
				<ul>
					<?php wp_list_pages(array(
						'depth' => 1,
						'sort_column'   => 'menu_order',
						'title_li'  => '',
					)); ?>		
				</ul>
			</section>
			<section class="box">
				<h3><?php _e('Categories', 'flotheme')?></h3>
				<ul>
				<?php wp_list_categories(array(
					'title_li'      => '',
					'hierarchical'  => 1,
					'show_count'    => 1,
				)); ?>	
				</ul>	
			</section>
		</section>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php get_footer(); ?>