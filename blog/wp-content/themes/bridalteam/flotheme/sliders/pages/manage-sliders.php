<?php global $flotheme_sliders; ?>
<div class="wrap" id="flotheme-sliders-page">
	<div id="icon-flotheme" class="icon32"><br/></div>
	<h2>Sliders</h2>
	<div id="flotheme-manage-sliders-wrapper">
		<div id="flotheme-create-slider-container">
			<h3>Manage Sliders</h3>
			<a class="button-primary button80 alignright" id="flotheme-add-slider-button" href="<?php echo Flotheme_Sliders::slidersUrl(array('action' => 'create')) ?>">Create New Slider</a>
			<div class="clear"></div>
		</div>
		<div id="flotheme-manage-sliders">		
			<ul>
				<?php foreach ($flotheme_sliders->getList() as $slider) : ?>
					<?php
						$slide = $flotheme_sliders->getFirstSlide($slider->ID);
					?>
					<li>
						<a href="<?php echo $flotheme_sliders->slidersUrl(array('action' => 'edit', 'id' => $slider->ID)) ?>">
							<span class="image">
								<?php if ($slide) : ?>
									<img src="<?php echo $slide->post_content_filtered ?>" alt="<?php echo $slider->post_title; ?>" />
								<?php endif; ?>
							</span>
							<span class="title"><?php echo $slider->post_title; ?></span>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
			<div class="clear"></div>
		</div>
	</div>
</div>