<?php get_header(); ?>

<div id="vendor" class="content">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

	<?php
		// get comments to count marks
		$comments = get_comments( 
			array( 
				'post_id' => get_the_ID(),
				'status'  => 'approve'
			)
		); 
		// count marks
		$total = flo_get_total_marks($comments);
		// get gallery images
		$images = flo_get_attached_images(get_the_ID(), false); 

		$services = flo_get_meta('vendor_services');
		$faq = flo_get_meta('vendor_faq');
	?>	

	<div class="vendor-information">

		<div class="vendor-back">
			<?php flo_first_taxonomy(get_the_ID(), 'vendor-category'); ?> VENUES IN <?php flo_first_taxonomy(get_the_ID(), 'vendor-location'); ?> >
		</div>		

		<div class="cf"></div>

		<div class="thumb">
			<?php the_post_thumbnail(); ?>
			<?php if (count($images)) : ?>
				<a href="#" class="view-gallery">VIEW FULL GALLERY</a>			
			<?php endif; ?>
		</div>

		<div class="description">
			<h2><?php the_title(); ?></h2>
			<h3><?php the_terms(get_the_ID(), 'gallery-category', '', ', '); ?></h3>
	
			<div class="review">
				<div class="stars <?php echo flo_draw_stars(round(array_sum($total)/5, 1)); ?>"><span></span></div><span>(<?php comments_number('0 reviews', '1 review', '% reviews'); ?>)</span>
			</div>

			<div class="location">
				<?php flo_meta('vendor_location'); ?>
			</div>

			<div class="info">
				<?php if (flo_get_meta('vendor_website')) : ?><li><label>website:</label> <span><a href="<?php flo_meta('vendor_website') ?>" target="_blank">visit my website »</a></span></li><?php endif; ?>
				<?php the_terms(get_the_ID(), 'vendor-category', '<li><label>category:</label> ', ' ', '</li>'); ?>
				<li><label>on-site catering:</label> <span><?php echo flo_get_meta('vendor_onsite_catering') ? 'yes' : 'no'; ?></span></li>
				<li><label>outside catering:</label> <span><?php echo flo_get_meta('vendor_outside_catering') ? 'yes' : 'no'; ?></span></li>
				<?php if (flo_get_meta('vendor_capacity')) : ?><li><label>maximum capacity:</label> <span><?php flo_meta('vendor_capacity') ?></span></li> <?php endif; ?>
			</div>			
		</div>


		<div id="tabs">
			<ul>
				<li data-tab="profile"><a href="#tab-profile">Profile</a></li>
				<?php if ($services != '') : ?><li data-tab="services"><a href="#tab-services">Services</a></li><?php endif; ?>
				<?php if ($faq != '') : ?><li data-tab="faq"><a href="#tab-faq" data-tab="faq" class="faq-tab" >FAQ</a></li><?php endif; ?>				
				<?php if(count($images)) : ?>
				<li data-tab="gallery"><a href="#tab-gallery" class="gallery-tab">Portfolio</a></li>
				<?php endif; ?>
				<li data-tab="reviews"><a href="#tab-reviews" class="reviews-tab">Reviews <span>(<?php echo get_comments_number(); ?>)</span></a></li>
			</ul>
		
			<?php if ($services != '') : ?>
			<div id="tab-services" class="tab">
				<?php echo wpautop($services); ?>
			</div>
			<?php endif; ?>
		
			<div id="tab-profile" class="tab">
				<?php the_content(); ?>
			</div>

			<div id="tab-reviews" class="tab">
				<div class="vendor-total-marks">
					<div class="left">
						<div class="total">
							<h3><?php echo round(array_sum($total)/5, 1); ?></h3>
							<span class="out-of">out of 5.0</span>
						</div>
					</div>

					<div class="right">
						<li><span class="mark">Quality of Service: (<?php echo $total['qos']; ?>/5.0)</span> <div class="stars <?php echo flo_draw_stars($total['qos']); ?>"><span></span></div></li>
						<li><span class="mark">Resonsiveness: (<?php echo $total['response']; ?>/5.0)</span> <div class="stars <?php echo flo_draw_stars($total['response']); ?>"><span></span></div></li>
						<li><span class="mark">Professionalism: (<?php echo $total['pro']; ?>/5.0)</span> <div class="stars <?php echo flo_draw_stars($total['pro']); ?>"><span></span></div></li>
						<li><span class="mark">Value: (<?php echo $total['value']; ?>/5.0)</span> <div class="stars <?php echo flo_draw_stars($total['value']); ?>"><span></span></div></li>
						<li><span class="mark">Flexibility: (<?php echo $total['flex']; ?>/5.0)</span> <div class="stars <?php echo flo_draw_stars($total['flex']); ?>"><span></span></div></li>
					</div>
				</div>

				<ol class="commentlist">
					<?php wp_list_comments(array('callback' => 'flotheme_review', 'max_depth' => 2, 'avatar_size' => 0), $comments); ?>
				</ol>
				 
				<?php if ( comments_open() && is_user_logged_in() ) : ?>
				<section class="respond cf" id="leave-review">
					<h3 class="a"><span>Leave</span> a Review</h3>
					<a name="respond"></a>
						<form action="<?php echo get_option('siteurl'); ?>/wp-comments-post.php" method="post" class="comment-form">
							<p class="error"></p>

							<?php 
								$add_fields = array(
									'qos' 		=> 'Quality of Service',
									'response'	=> 'Responsiveness',
									'pro'		=> 'Professionalism',
									'value'		=> 'Value of Cost',
									'flex'		=> 'Capability/Flexibility',									
								);
							?>
							<div class="area1">

								<p>
									<label>Event Type</label>
									<?php 
										$event_type = flo_get_option('vendor_event_type'); $event_type = explode(',', $event_type);
										if ( empty($event_type[0]) ) $event_type = array('Event');
									?>
									<select name="event_type" id="event_type">
										<?php foreach ($event_type as $et) : ?>
										<option value="<?php echo $et; ?>"><?php echo $et; ?></option>
										<?php endforeach; ?>
									</select>									
								</p>		

								<p>
									<label>Event Date</label>
									<input type="text" name="event_date" id="event_date" placeholder="" />
								</p>																

								<?php foreach ($add_fields as $af => $label) : ?>
								<p>
									<label><?php echo $label ?></label>
									<select name="rating_<?php echo $af; ?>" id="rating_<?php echo $af; ?>">
										<?php for( $i=5; $i >= 1; $i-- ) { ?>
										<option value="<?php echo $i; ?>"><?php echo $i; ?></option>
										<?php } ?>										
									</select>
								</p>
								<?php endforeach; ?>

								<p>
									<label>Working with</label>
									<?php 
										$contact_person = flo_get_meta('vendor_contact_person'); $contact_person = explode(',', $contact_person);
										if ( empty($contact_person[0]) ) $contact_person = array('Manager');
									?>
									<select name="contact_person" id="contact_person">
										<?php foreach ($contact_person as $cp) : ?>
										<option value="<?php echo $cp; ?>"><?php echo $cp; ?></option>
										<?php endforeach; ?>
									</select>									
								</p>

							</div>
							<div class="area3 ta">
								<textarea placeholder="<?php _e('Type your review here ...', 'flotheme'); ?>" name="comment" id="comment" class="input-xlarge" tabindex="4" rows="5" cols="40" required="required"></textarea>
							</div>
							<div class="cf"></div>
							<div class="button">
								<input name="submit" class="submit" type="submit" tabindex="5" value="<?php _e('Add Review', 'flotheme'); ?>" />
							</div>
							<?php comment_id_fields(); ?>
							<?php do_action('comment_form', $post->ID); ?>
						</form>
				</section>
				<?php endif; ?>				
			</div>

			<?php if(count($images)) : ?>
			<div id="tab-gallery" class="tab">
				<div class="photos">
					<div id="slider" class="flexslider">
					  <ul class="slides">
						<?php foreach ($images as $img) : ?>
							<li><?php echo flo_wrap_images_credits(wp_get_attachment_image($img->ID, 'full')); ?></li>
						<?php endforeach; ?>
					  </ul>
					</div>
					<div class="bottom">
						<div id="carousel" class="flexslider">
						  <ul class="slides">
							<?php foreach ($images as $img) : ?>
								<li><?php echo wp_get_attachment_image($img->ID, 'full'); ?></li>
							<?php endforeach; ?>
						  </ul>
						</div>												

						<div class="cf"></div>
					</div>
				</div>				
			</div>
			<?php endif; ?>

			<?php if ($faq != '') : ?>
			<div id="tab-faq" class="tab">
				<?php echo wpautop($faq); ?>
			</div>				
			<?php endif; ?>
		</div>		
	</div>

	<script>
		$(window).load(function() {
		  $('.write-review').click(function(){
		  	
		  	$('.reviews-tab').click()
		  	$('#leave-review').scrollTo('#leave-review');

		  	return false;
		  });

		  $('.view-gallery').click(function(){
		  	
		  	$('.gallery-tab').click()
		  	$('#slider').scrollTo('#slider');

		  	return false;
		  });

		  $("#tabs").tabs({
		  	 activate: function( event, ui ) {
		  	 	if ( 'gallery' === ui.newTab.data('tab') ) { 

					  $('#carousel').flexslider({
					    animation: "slide",
					    controlNav: false,
					    animationLoop: false,
					    slideshow: false,
					    itemWidth: 110,
					    itemMargin: 19,
					    asNavFor: '#slider'
					  });
					   
					  $('#slider').flexslider({
					    animation: "slide",
					    controlNav: false,
					    animationLoop: false,
					    slideshow: false,
					    sync: "#carousel"
					  });		  	 		
		  	 	}
		  	 }
		  });

		  $('select').dropkick();
		});
	</script>

	<div class="vendor-sidebar">
		<div class="block contact-info">
			<?php if (flo_get_meta('vendor_email')) : ?>
				<a href="mailto:<?php echo flo_meta('vendor_email'); ?>" class="email" rel="external">Email us</a>
			<?php endif; ?>
			<?php if (flo_get_meta('vendor_phone')) : ?>
				<div class="phone"><?php flo_meta('vendor_phone'); ?></div>
				<p>Please let this vendor know you found them on Bridal Team</p>
			<?php endif; ?>
		</div>

		<div class="block review">
			<div class="stars <?php echo flo_draw_stars(round(array_sum($total)/5, 1)); ?>"><span></span></div>

			<div class="mark"><?php echo round(array_sum($total)/5, 1); ?></div>
			<div class="out-of">out of 5.0</div>

			<div class="reviews-number"><?php comments_number( '0 Reviews', '1 Review', '% Reviews'); ?></div>
		</div>

		<?php 
			$s['facebook'] = flo_get_meta('vendor_facebook'); 
			$s['twitter'] = flo_get_meta('vendor_twitter'); 
			$s['pinterest'] = flo_get_meta('vendor_pinterest'); 
		?>
		<div class="buttons">
			<?php $k = 1; ?>
			<a href="#" class="write-review g<?php echo $k; $k++ ?>">Write<span>A REVIEW</span></a>
			<?php if ($s['facebook']) : ?><a href="<?php echo $s['facebook']; ?>" rel="external" class="facebook g<?php echo $k; $k++ ?>">FIND US ON<span>FACEBOOK</span></a><?php endif; ?>
			<?php if ($s['pinterest']) : ?><a href="<?php echo $s['pinterest']; ?>" rel="external" class="pinterest g<?php echo $k; $k++ ?>">OUR BOARDS<span>on pinterest</span></a><?php endif; ?>
			<?php if ($s['twitter']) : ?><a href="http://twitter.com/<?php echo $s['twitter']; ?>" rel="external" class="twitter g<?php echo $k; $k++ ?>">Add us<span>on twitter</span></a><?php endif; ?>
			<?php if (flo_get_meta('vendor_website')) : ?><a href="<?php flo_meta('vendor_website') ?>" target="_blank" class="site g<?php echo $k; $k++ ?>">CHECK OUT<span>OUR WEBSITE</span></a><?php endif; ?>
		</div>

		<?php $alsolike = get_posts('post_type=vendor&post_status=publish&numberposts=3'); ?>
		<?php if (!empty($alsolike)) : ?>
		<div class="block also-like">
			<h3 class="a">You might also like...</h3>
			<?php foreach ($alsolike as $av) : ?>
			<li>
				<div class="thumb"><a href="<?php echo get_permalink( $av->ID); ?>"><?php echo get_the_post_thumbnail( $av->ID, 'post-thumbnail' ); ?></a></div>
				<h3><a href="<?php echo get_permalink( $av->ID); ?>"><?php echo $av->post_title; ?></a></h3>
			</li>
			<?php endforeach; ?>
		</div>
		<?php endif; ?>
	</div>

	<div class="cf"></div>

	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>
</div>

<div class="cf"></div>
<?php get_footer(); ?>