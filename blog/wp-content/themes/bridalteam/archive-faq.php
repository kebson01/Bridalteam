<?php get_header(); ?>

<div class="page" id="faq">
	<?php $latest_faq = get_posts('post_type=faq&orderby=date&order=DESC&numberposts=1'); ?>
	<?php flo_page_title('Frequently asked questions'.'<span class="date">last updated on '.date('M / j / Y', strtotime($latest_faq[0]->post_date)).'</span>') ?>	
	
	<div class="question-list">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<article <?php post_class(); ?>>
			<h3><?php the_title(); ?></h3>
			<div class="story"><?php the_content(); ?></div>
		</article>
	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>
	</div>

	<h4>STILL HAVE A QUESTION ?</h4>
	<a href="<?php echo home_url('contact'); ?>" class="connect">connect with us</a>
</div>

<script>
	$(document).ready(function(){
		$('article.faq').click(function(){
			$(this).toggleClass('active');
		}).filter(':first').click();
	})
</script>

<?php get_footer(); ?>