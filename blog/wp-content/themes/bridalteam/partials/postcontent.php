<section class="story cf">
	<?php 
	add_filter('the_content', 'flo_clear_images', 1);
	add_filter('the_content', 'flo_wrap_images_credits', 2);
	the_content();
	remove_filter('the_content', 'flo_clear_images', 1);
	remove_filter('the_content', 'flo_wrap_images_credits', 2);
	?>
</section>
<?php wp_link_pages(array(
	'before' => '<section class="story-pages"><p>' . __('Pages:', 'flotheme'),
	'after'	 => '</p></section>',
)) ?>