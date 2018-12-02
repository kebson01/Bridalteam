	<?php if (!is_single() && !is_attachment()) : ?>
		<footer>
			<a href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>" class="toggle ta"><?php _e('Open Post', 'flotheme')?></a>
			<span class="loading"></span>	
		</footer>
	<?php endif; ?>
</article>