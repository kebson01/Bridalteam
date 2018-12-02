<?php the_tags('<div class="tags ta">' . __('<span class="label">Tags: </span>', 'flotheme'), ' &bullet; ', '</div>');?>
		
<div class="actions">
	<h3><?php printf(_n('1 Comment', '%1$s Comments', get_comments_number(), 'flotheme'), number_format_i18n(get_comments_number())); ?></h3>	

	<div class="share">
		<span class="fblike">
			<a href="<?php flo_share('fb'); ?>"></a>
		</span>
		<span class="tweet">
			<a href="<?php flo_share('twi'); ?>"></a>
		</span>
		<span class="pinit">
			<a href="<?php flo_share('pin'); ?>"></a>
		</span>		
	</div>		
</div>