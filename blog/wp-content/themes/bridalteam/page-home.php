<?php get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<section id="homepage">

		<div class="wrapper">
			<?php if (!is_user_logged_in()) flo_login_form('main'); ?>

			<div class="blocks">
				<?php $i=1; while($i<=3) : ?>
				<div class="block b<?php echo $i; ?>">
					<a href="<?php flo_option('block'.$i.'u'); ?>" style="background-image: url(<?php flo_option('block'.$i.'i'); ?>);"></a>
				</div>
				<?php $i++; endwhile; ?>
			</div>
		</div>
		
		<div class="flexslider">
			<ul class="slides">
				<?php $slider = flo_sliders_get_slider('sneak-peek');  ?>
                <?php if($slider):?>
                    <?php foreach ($slider['slides'] as $k => $slide) : ?>
                    <li style="background-image: url(<?php echo $slide['image'] ?>);">
                    	<div class="wrapper">                    		
                    	<?php if ($slide['url'] != '') : ?>
                    		<a href="#slide_<?php echo $k; ?>" class="video-p">video</a>
                    		<div class="hide" id="slide_<?php echo $k; ?>"><?php echo flo_create_wp_embed_player($slide['url']); ?></div>
	                    <?php endif; ?>
	                    <?php if ($slide['title'] != '') : $supertitle = explode('&', $slide['title']); ?>
		                    <?php if (count($supertitle) > 1) : ?>
		                    	<div class="title super">
		                    		<h2 class="top"><?php echo $supertitle[0]; ?></h2>
		                    		<h2 class="bottom"><?php echo $supertitle[1]; ?></h2>
		                    	</div>
			                <?php else: ?>
				                <div class="title">
				                    <h2><?php echo  $slide['title']; ?></h2>
			                    </div>
			                <?php endif; ?>
		                <?php endif; ?>
                    	</div>
                    </li>
                    <?php endforeach; ?>
                <?php endif;?>
			</ul>
		</div>

		<script>
		$(document).ready(function(){
			$('.video-p').colorbox({inline: true});
		});
		</script>

	</section>

<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>

<?php get_footer(); ?>