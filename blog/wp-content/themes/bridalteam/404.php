<?php get_header(); ?>
<section id="page404" class="page">
	<?php //global $wp_query; var_dump($wp_query); ?>
	<?php flo_page_title('Error') ?>
	<p><?php _e('If you see this message, that means you hit the wrong page, but don’t worry, we have a few options for you.', 'flotheme');?></p>
	<div class="buttons ta">
		<a href="javascript:history.go(-1)"><?php _e('Go Back', 'flotheme')?> &gt;</a>
		<a href="<?php echo home_url();?>"><?php _e('Homepage', 'flotheme')?> &gt;</a>
		<?php $contact = flo_get_page('contact'); ?>
		<?php if ($contact) : ?>
			<a href="<?php echo get_permalink($contact->ID)?>"><?php _e('Contact Us', 'flotheme')?> &gt;</a>
		<?php endif; ?>
	</div>
</section>
<?php get_footer(); ?>