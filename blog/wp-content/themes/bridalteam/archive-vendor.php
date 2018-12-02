<?php get_header(); ?>

<div id="container" class="vendor">
	<?php 
		$imgs = get_option( 'taxonomy_image_plugin' );
	?>
	<?php $vendorcats = get_categories(array('taxonomy' => 'vendor-category', 'hide_empty' => false)); ?>
	<?php $i=1; foreach ($vendorcats as $vc) : ?>
		<article class="item cat-item gradient<?php echo $i; ?>">
			<div class="thumb"><?php echo wp_get_attachment_image( $imgs[$vc->term_taxonomy_id], 'full' ); ?></div>
			<div class="bottom">
			<a href="<?php echo get_term_link( $vc, 'vendor-category' ); ?>">
				<h3><?php echo $vc->name; ?> <span>open category</span></h3>
			</a>
			</div>
		</article>
	<?php $i++; endforeach; ?>

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