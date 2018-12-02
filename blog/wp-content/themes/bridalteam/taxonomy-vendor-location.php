<?php 
	get_header(); 
	global $_wedfolio;
	$term = get_query_var('vendor-location');
	$term = get_term_by( 'slug', $term, 'vendor-location' );
?>

<div id="container" class="vendor-category vendor-location">
	<article class="item welcome-cats">
		<h2>Location: <?php echo $term->name; ?></h2>
		<a href="<?php echo home_url('/vendor/'); ?>" class="view-all">view all categories</a>
	</article>

	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

		<article <?php post_class('item'); ?>>
			<div class="thumb">
			<a href="<?php the_permalink(); ?>"><?php the_post_thumbnail(); ?></a>
			</div>
			
			<?php
				// get comments to count marks
				$comments = get_comments( 
					array( 'post_id' => get_the_ID(), )
				); 
				// count marks
				$total = flo_get_total_marks($comments);
			?>	
			<div class="info">
				<div class="text">
					<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="stars <?php echo flo_draw_stars(round(array_sum($total)/5, 1)); ?>"><span></span></div><span class="review">(<?php comments_number('0 reviews', '1 review', '% reviews'); ?>)</span>
					<p><?php flo_meta('vendor_address'); ?></p>
				</div>
			</div>
		</article>

	<?php endwhile; else: ?>
		<div class="item not-found"><?php flo_part('notfound')?></div>
	<?php endif; ?>
	<?php flo_page_links();?>

	<div class="cf"></div>
</div>

<script>
$(window).load(function(){


    $(function(){

      var $container = $('#container');
    
      $container.isotope({
	      itemSelector : '.item',
	      transformsEnabled: false,
		  columnWidth : 320,
		  animationOptions: {
		     duration: 750,
		     easing: 'linear',
		     queue: false
		   }		  
      });
      
      $container.infinitescroll({
        navSelector  : 'ul.page-numbers',    // selector for the paged navigation 
        nextSelector : 'a.next',  // selector for the NEXT link (to page 2)
        itemSelector : '.item',     // selector for all items you'll retrieve
        loading: {
            finishedMsg: 'No more pages to load.',
            img: '<?php bloginfo('template_url'); ?>/images/loading2.gif'
          }
        },
        // call Isotope as a callback
        function( newElements ) {
          $container.isotope( 'insert', $( newElements ) ); 
        }
      );
      
    
    });	

});

</script>

<?php get_footer(); ?>