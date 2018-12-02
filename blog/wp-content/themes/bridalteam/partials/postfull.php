<section class="full"><?php if (is_single()) : ?>
	<?php flo_part('postcontent');?>
	<?php flo_part('postactions');?>
	<?php comments_template(); ?>
<?php endif; ?></section>