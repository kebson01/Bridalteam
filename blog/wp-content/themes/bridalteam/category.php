<?php get_header(); ?>

<div id="container">
	<?php if (!get_query_var('paged')) : ?>

	<article class="item welcome-cats blog-categories">
		<h2><?php echo single_cat_title( '', false ); ?></h2>
		<a href="<?php echo home_url('/'); ?>" class="view-all">view all categories</a>
		<?php 
			$categories = get_categories( $args ); 
		?> 
		<ul class="cats">
			<?php $i=1; foreach ($categories as $c) : if ($i==11) break; ?>
				<li class="cat-item gradient<?php echo $i; ?>"><a href="<?php echo get_category_link( $c ); ?>"><?php echo $c->name; ?></a></li>
			<?php $i++; endforeach; ?>
		</ul>			
	</article>

	<?php endif; ?>

	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

		<article <?php post_class('item'); ?>>
			<div class="thumb">
				<a href="<?php the_permalink(); ?>"><?php echo flotheme_show_post_cover(get_the_ID()); ?></a>
			</div>
			<h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
				<div class="by-author ta">
					<time pubdate="<?php the_time('c'); ?>"><?php the_time(get_option('date_format'));?></time>
					<span class="sep"><?php _e('by', 'flotheme'); ?></span>
					<span class="author vcard"><?php the_author_posts_link() ?></span>
				</div>
				<div class="categories">
					<?php _e('in', 'flotheme'); ?>
					<?php the_category(', '); ?>
					 | <?php comments_number( '0 comments', '1 comment', '% comments'); ?>
				</div>	
		</article>

	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>

	<?php flo_page_links();?>

	<div class="cf"></div>
</div>

<script>
$(window).load(function(){
	$.Isotope.prototype._getCenteredMasonryColumns = function() {
	    this.width = this.element.width();
	    
	    var parentWidth = this.element.parent().width();
	    
	                  // i.e. options.masonry && options.masonry.columnWidth
	    var colW = this.options.masonry && this.options.masonry.columnWidth ||
	                  // or use the size of the first item
	                  this.$filteredAtoms.outerWidth(true) ||
	                  // if there's no items, use size of container
	                  parentWidth;
	    
	    var cols = Math.floor( parentWidth / colW );
	    cols = Math.max( cols, 1 );

	    // i.e. this.masonry.cols = ....
	    this.masonry.cols = cols;
	    // i.e. this.masonry.columnWidth = ...
	    this.masonry.columnWidth = colW;
	  };
	  
	  $.Isotope.prototype._masonryReset = function() {
	    // layout-specific props
	    this.masonry = {};
	    // FIXME shouldn't have to call this again
	    this._getCenteredMasonryColumns();
	    var i = this.masonry.cols;
	    this.masonry.colYs = [];
	    while (i--) {
	      this.masonry.colYs.push( 0 );
	    }
	  };

	  $.Isotope.prototype._masonryResizeChanged = function() {
	    var prevColCount = this.masonry.cols;
	    // get updated colCount
	    this._getCenteredMasonryColumns();
	    return ( this.masonry.cols !== prevColCount );
	  };
	  
	  $.Isotope.prototype._masonryGetContainerSize = function() {
	    var unusedCols = 0,
	        i = this.masonry.cols;
	    // count unused columns
	    while ( --i ) {
	      if ( this.masonry.colYs[i] !== 0 ) {
	        break;
	      }
	      unusedCols++;
	    }
	    
	    return {
	          height : Math.max.apply( Math, this.masonry.colYs ),
	          // fit container to columns that have been used;
	          width : (this.masonry.cols - unusedCols) * this.masonry.columnWidth
	        };
	  };


    $(function(){

      var $container = $('#container');
    
      $container.isotope({
	      itemSelector : '.item',
	      transformsEnabled: false,
		  columnWidth : 210,
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