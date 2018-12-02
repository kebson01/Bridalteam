<?php get_header(); ?>
<?php flo_page_title(sprintf(__('Tag Archives: %s', 'flotheme'),  single_tag_title( '', false ))) ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('posthead');?>
	<?php flo_part('postpreview' );?>
	<?php flo_part('postfull');?>
	<?php flo_part('postfooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php flo_page_links();?>
<?php flo_part('archives'); ?>
<?php get_footer(); ?>