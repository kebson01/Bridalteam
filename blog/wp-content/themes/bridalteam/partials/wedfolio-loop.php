		<?php 
			global $_wedfolio;
			$class = 'item'; 
			if (flo_is_fresh()) $class .= ' fresh'; 
		?>
		<article <?php post_class($class); ?>>
			<div class="thumb">
				<a href="<?php the_permalink(); ?>" class="open-single-wedfolio"><img src="<?php echo get_the_content(); ?>" /></a>
			</div>
				
			
			<div class="info">
				<div class="text">
					<h2><?php the_title(); ?></h2>
					<div class="by-author ta">
						<time pubdate="<?php the_time('c'); ?>"><?php the_time(get_option('date_format'));?></time>
						<span class="sep"><?php _e('by', 'flotheme'); ?></span>
						<span class="author vcard"><?php echo get_the_author(); //_posts_link() ?></span>
						<?php _e('in', 'flotheme'); ?>
						<?php the_terms(get_the_ID(), 'wedfolio-category', '', ', '); ?>
					</div>
				</div>
			</div>

			<div class="bottom">
				<div class="cnt comments"><?php comments_number( '0', '1', '%'); ?></div>
				<div class="cnt likes"><?php echo $_wedfolio->getPostLikes(get_the_ID(),'like'); ?></div>
				<div class="cnt loves"><?php echo $_wedfolio->getPostLikes(get_the_ID(),'love'); ?></div>
			</div>
		</article>