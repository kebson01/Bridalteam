<?php 
	$args = array(
		'post_type' => 'post', 
		'post_status' => 'publish',
		'numberposts' => 3
	);
	$alsolike = get_posts($args); 
?>
<section class="also-like">
	<h3>You might also like...</h3>
	<?php foreach ($alsolike as $ap) : ?>
	<li>
		<div class="thumb"><a href="<?php echo get_permalink( $ap->ID ); ?>"><?php echo flotheme_show_post_cover($ap->ID); ?></a></div>
		<h3><a href="<?php echo get_permalink( $ap->ID ); ?>"><?php echo $ap->post_title; ?></a></h3>
	</li>
	<?php endforeach; ?>
</section>