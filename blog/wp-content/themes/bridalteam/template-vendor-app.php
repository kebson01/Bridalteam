<?php 
/**
 * Template Name: Template Vendor App
 */
get_header(); ?>
<div id="vendor-app">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<?php flo_part('pagehead');?>
			<section class="story">
				<?php flo_page_title(get_the_title()) ?>
				<?php echo do_shortcode( get_the_content() ); ?>

				<div class="email"><a href="mailto:vendorservices@bridalteam.com">vendorservices@bridalteam.com</a></div>

				<script>

				jQuery(document).bind('gform_post_render', function(){
					$('#field_3_7, #field_3_8, #field_3_9, #field_3_10, .small-fee').wrapAll('<div class="section-block" />'); 

					$('#vendor-app .email').show();

					<?php if (!is_mobile()) : ?>
						$('select').dropkick();
					<?php endif; ?>					
				});

				</script>
			</section>
		<?php flo_part('pagefooter');?>
	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>	
</div>

<?php get_footer(); ?>