<header class="preview">
	<div class="title cf">
		<?php global $_wedfolio; ?>
		
		<h2><a href="<?php the_permalink() ?>" title="<?php the_title_attribute(); ?>" rel="bookmark"><?php the_title();?></a></h2>
		<time pubdate="<?php the_time('c'); ?>"><?php the_time('M');?> <span><?php the_time('d');?></span></time>
		<div class="meta ta">			
			<span class="by-author ta">
				<span class="sep"><?php _e('by', 'flotheme'); ?></span>
				<span class="author vcard"><?php the_author_posts_link() ?></span>
			</span>
			<span class="categories">
				<?php _e('in', 'flotheme'); ?>
				<?php the_category(', '); ?>
			</span>
		</div>
	</div>
	
	<?php if (has_post_format('gallery')) : ?>
		<div class="flexslider ta">
			<ul class="slides">
				<?php foreach(flo_get_attached_images() as $image):?>
					<li><?php echo wp_get_attachment_image($image->ID, array(900, 600))?></li>
				<?php endforeach;?>
			</ul>
		</div>
	<?php elseif (has_post_thumbnail()):?>
		<figure>
			<a href="<?php the_permalink() ?>" title="<?php the_title_attribute(); ?>" rel="bookmark"><?php the_post_thumbnail(array(900, 600))?></a>
		</figure>
	<?php else: ?>
		<?php flo_excerpt(); ?>
	<?php endif; ?>
</header>