<?php get_header(); ?>
<?php if (have_posts()) : the_post(); ?>		
	<?php flo_page_title(sprintf( __( 'Author: %s', 'flotheme' ), "<span class='vcard'><a class='url fn n' href='" . get_author_posts_url( get_the_author_meta( 'ID' ) ) . "' title='" . esc_attr( get_the_author() ) . "' rel='me'>" . get_the_author() . "</a></span>" )) ?>
<?php rewind_posts(); endif; ?>
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