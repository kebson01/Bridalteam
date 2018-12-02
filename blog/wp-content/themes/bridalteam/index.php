<?php get_header(); ?>

<div id="container">
	<?php if (!get_query_var('paged')) : ?>

		<!-- <article class="item blog-categories">
			<?php $categories = get_categories( $args ); ?> 
			<ul class="cats">
				<?php //$i=1; foreach ($categories as $c) : if ($i==11) break; ?>
					<li class="cat-item gradient<?php //echo $i; ?>"><a href="<?php //echo get_category_link( $c ); ?>"><?php //echo $c->name; ?></a></li>
				<?php //$i++; endforeach; ?>
			</ul>		 
		</article> -->

		<article class="item blog-categories category-list">
			<?php 
				$categories = flo_get_option('featured_categories'); 
				$categories = explode(',', $categories);
			?> 
			<ul class="cats">
				<?php $i=0; foreach ($categories as $c) : if ($i==11) break; ?>
				<?php $cat = get_category_by_slug( $c ); ?>
					<li class="cat-item cat gradient<?php echo $i+1; ?> c<?php echo $i; ?> <?php echo $c; ?>"><a href="<?php echo get_category_link( $cat ); ?>"><?php //echo $cat->name; ?></a></li>
				<?php $i++; endforeach; ?>
			</ul>		 
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