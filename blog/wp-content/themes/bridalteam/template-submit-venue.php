<?php 
/**
 * Template Name: Template Submit Venue
 */
get_header(); 
?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
<div id="venue-submit">
	<?php flo_part('pagehead');?>
		<section class="story">
			<?php flo_page_title(get_the_title()) ?>
			<?php the_content();?>
		</section>

		<ul class="venue-columns">
			<li class="column column1"> 
				<?php flo_option('venue_column1'); ?>
			</li>
			<li class="column column2"> 
				<?php flo_option('venue_column2'); ?>
			</li>
			<li class="column column3"> 
				<?php flo_option('venue_column3'); ?>
			</li>
			<li class="column column4"> 
				<?php flo_option('venue_column4'); ?>
			</li>
			<li class="column column5"> 
				<?php flo_option('venue_column5'); ?>
			</li>
			<li class="column column6"> 
				<?php flo_option('venue_column6'); ?>
			</li>			
		</ul>

		<div class="venue-bottom">
			<h3>Join <strong>TODAY!</strong></h3>
			<a href="mailto:vendorservices@bridalteam.com">vendorservices@bridalteam.com</a>
			<a href="<?php echo home_url('vendor-application'); ?>" class="submit-button"></a>
		</div>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
</div>
<?php get_footer(); ?>