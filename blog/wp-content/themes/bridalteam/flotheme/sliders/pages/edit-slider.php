<?php global $flotheme_sliders; ?>
<div class="wrap" id="flotheme-edit-slider-page" data-id="<?php echo (int) $flotheme_sliders->id ?>">
	<div id="icon-flotheme" class="icon32"><br/></div>
	<h2><?php echo $flotheme_sliders->id ? 'Edit' : 'Add New' ?> Slider</h2>
	
	<?php if (!$flotheme_sliders->slider) : ?>
		<form action="" method="post">
	<?php endif;?>
	
	<div id="flotheme-edit-slider-wrapper" class="metabox-holder flotheme-slider-edit">
		<p class="alignleft"><a href="<?php echo Flotheme_Sliders::slidersUrl() ?>">Return to Sliders Listing</a></p>
		<?php if ($flotheme_sliders->slider && $flotheme_sliders->slider->post_status == 'publish') : ?>
			<p class="alignright submitbox"><a href="<?php echo Flotheme_Sliders::slidersUrl(array('action' => 'delete', 'id' => $flotheme_sliders->slider->ID, '_wpnonce' => wp_create_nonce('flotheme_slider_delete_nonce'))) ?>" id="flotheme-slider-delete" class="submitdelete">Delete Slider</a></p>
		<?php endif; ?>
		
		<div class="clear"></div>
		
		<div id="titlediv">
			<div id="titlewrap">						
				<input type="text" name="title" size="40" maxlength="255" placeholder="Type slider name here" required="required" id="title" value="<?php echo $flotheme_sliders->slider->post_title ?>" />
			</div>
		</div>
		<?php if ($flotheme_sliders->slider) : ?>
			<?php $slider = $flotheme_sliders->slider; ?>
		
			<?php if ($slider->post_status == 'publish') : ?>
				<div id="flotheme-slider-info-hide"></div>
				<div class="clear"></div>
				<div id="flotheme-slider-info">
					
					<h2>Slider Shortcode</h2>
					<dl class="shortcode" data-slug="<?php echo $slider->post_name ?>">
						<dt>Slider Slug</dt>
						<dd><?php echo $slider->post_name ?></dd>
						
						<dt>Slideshow</dt>
						<dd>
							<select name="slideshow">
								<option value="1" selected="selected">Yes</option>
								<option value="0">No</option>
							</select>
						</dd>
						
						<dt>Animation Type</dt>
						<dd>
							<select name="animation">
								<option value="fade" selected="selected">Fade</option>
								<option value="slide">Slide</option>
							</select>
						</dd>
						
						<dt>Control Navigation</dt>
						<dd>
							<select name="controlNav">
								<option value="1">Yes</option>
								<option value="0" selected="selected">No</option>
							</select>
						</dd>
						
						<dt>Randomize Slides</dt>
						<dd>
							<select name="randomize">
								<option value="1">Yes</option>
								<option value="0" selected="selected">No</option>
							</select>
						</dd>
						
						<dt>Slider Shortcode</dt>
						<dd><cite><input type="text" name="shortcode" id="flotheme-slider-shortcode" /></cite></dd>
					</dl>
					<div class="clear"></div>
				</div>
			<?php endif; ?>
		
			<div id="flotheme-slides-sortable" class="meta-box-sortables ui-sortable">
					<?php foreach ($flotheme_sliders->getSlides($slider->ID) as $k => $slide) : ?>
						<div class="slide" id="flotheme-slide-<?php echo $k ?>" data-id="<?php echo $slide->ID ?>">
							<div class="handle" title="Click and drag to reorder">SORT</div>
							<a href="#" class="delete">Delete</a>
							<div class="box-image">
								<div class="image"><img /></div>
								<span><input type="text" name="image" placeholder="Or enter an image URL" value="<?php echo $slide->post_content_filtered ?>" /></span>
							</div>
							<div class="box-content">
								<div class="box-title"><span>Title</span><input type="text" value="<?php echo $slide->post_title ?>" name="title" /></div>
								<div class="box-url"><span>URL</span><input type="text" value="<?php echo $slide->pinged ?>" name="url" /></div>
								<div class="box-description"><span>Description</span><textarea cols="30" rows="4" name="description" class="description"><?php echo $slide->post_content ?></textarea></div>
								<div class="box-html"><span>HTML</span><textarea cols="30" rows="4" name="html" class="html"><?php echo $slide->post_excerpt ?></textarea></div>
							</div>
						</div>
					<?php endforeach; ?>
			</div>
			<p class="alignleft"><a id="flotheme-add-new-slide-button" class="button-secondary button80" href="#">Add a New Slide</a></p>
			<p class="alignright" id="flotheme-save-slider-container">
				<img src="<?php echo esc_url( admin_url( 'images/wpspin_light.gif' ) ); ?>" class="ajax-loading" id="flotheme-sliders-loading" alt="">
				<a class="button-primary button80" id="flotheme-save-slider-button" href="#">Save Slider</a>
			</p>
		<?php else: ?>
			<p class="alignright">
				<a class="button-primary button80" href="#" id="flotheme-create-slider">Create Slider</a>
			</p>			
		<?php endif; ?>
		<div class="clear"></div>
		<?php if (!$flotheme_sliders->slider) : ?>
			</form>
		<?php endif;?>
	</div>
</div>