<aside id="sidebar">

	<div class="item blog-categories category-list">
		<?php 
			//$categories = get_categories( $args ); 
			$categories = flo_get_option('featured_categories'); 
			$categories = explode(',', $categories);
		?> 
		<ul class="cats">
			<?php $i=0; foreach ($categories as $c) : if ($i==11) break; ?>
			<?php $cat = get_category_by_slug( $c ); ?>
				<li class="cat-item cat gradient<?php echo $i+1; ?> c<?php echo $i; ?> <?php echo $c; ?>"><a href="<?php echo get_category_link( $cat ); ?>"><?php //echo $cat->name; ?></a></li>
			<?php $i++; endforeach; ?>
			<?php //$i=1; foreach ($categories as $c) : if ($i==11) break; ?>
				<!-- <li class="cat-item gradient<?php //echo $i; ?>"><a href="<?php //echo get_category_link( $c ); ?>"><?php //echo $c->name; ?></a></li> -->
			<?php //$i++; endforeach; ?>
		</ul>		 
	</div>	

	<?php flo_part('archives'); ?>

	<div class="block">
		<?php wp_bannerize(); ?>
	</div>

	<?php 
		$args = array( 
			'post_type'		=> 'post',
			'post_status' 	=> 'publish',
			'numberposts'	=> 3,
		);
		$popular_posts = get_posts($args);
	?>
	<?php if (!empty($popular_posts)) : ?>
	<div class="block white" id="popular-posts">
		<h4 class="a">Most popular posts</h4>
		<?php foreach($popular_posts as $pp) : ?>
		<li>
			<h3><a href="<?php echo get_permalink($pp->ID); ?>"><?php echo $pp->post_title; ?></a></h3>
			<div class="thumb"><a href="<?php echo get_permalink($pp->ID); ?>"><?php echo flotheme_show_post_cover($pp->ID, 'medium'); ?></a></div>
			<div class="info">IN <?php the_category(', ', 'single', $pp->ID); ?></div>
		</li>
		<?php endforeach; ?>
	</div>
<?php endif; ?>
</aside>