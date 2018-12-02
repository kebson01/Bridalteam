<?php get_header(); ?>
	<div id="services">
	<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
		<?php flo_part('pagehead');?>
			<section class="story">
				<?php the_content();?>
				<script>

				jQuery(document).bind('gform_post_render', function(){
					var formid = 7;

					$('.gform_wrapper .gf_progressbar_wrapper').hide();

					// $('#services .page').prepend('<a href="#" class="next-page">NEXT</a><a href="#" class="prev-page">PREV</a>');

					var pages = $('.gform_body .gform_page');

					pages.each(function(){
						var fn = $(this);

						fn.prepend('<a href="#'+fn.attr('id')+'" class="nextpage">NEXT</a>');
					});
			

					$('.disabled').click(function(){
						return false;
					});

					<?php if (!is_mobile()) : ?>
						$('.dropdown select').dropkick();
					<?php endif; ?>
					
					if ($('#packages-label-list').length == 0) {

						$('#gform_page_'+formid+'_2').append('<div id="packages-label-list"><h2>COMPARE PACKAGES</h2></div>');

						$('.package_custom .gfield_checkbox li > label').each(function(){
							var fn = $(this);
							var fn_text = fn.text().split("\;"); 
							var tooltip = '';

							if (fn_text[1] !== undefined) {
								tooltip = '<span title="'+fn_text[1]+'" class="info tooltip"></span>';								
							}

							$('#packages-label-list').append('<li>'+fn_text[0]+tooltip+'</li>');	
							
						});
					}

					if ($('#event-coordination').length == 0) {
						$('.event-coordination').wrapAll('<div id="event-coordination" />'); 	

						$('#event-coordination .gfield_description, #event-coordination .gfield_description').each(function(){
							$(this).attr('title',$(this).text()).addClass('tooltip'); 
						});
					}
					if ($('#wedding-documents').length == 0) {
						$('.wedding-documents').wrapAll('<div id="wedding-documents" />'); 	
					}		

					// IF IE
					if (!$.support.leadingWhitespace) {
					    //IE7 and 8 stuff
						// if ( $.browser.msie ) {
						// IE step3 package click
						$('#input_'+formid+'_24 input + label').click(function(){
							var fn = $(this);
							fn.siblings().change();
						});

						// IE step3 custom package click
						$('#input_'+formid+'_49 input + label').click(function(){
							var fn = $(this);
							var chkbox = fn.siblings();
							chkbox.trigger('click');
						});

						// IE step4 event-coordination click
						$('#event-coordination input + label').click(function(){
							var fn = $(this);
							var chkbox = fn.siblings();
							chkbox.trigger('click');
						});

						// IE step4 wedding-documents click
						$('#wedding-documents input + label').click(function(){
							var fn = $(this);
							var chkbox = fn.siblings();
							chkbox.trigger('click');
						});

						$('.gfield_radio input + label, .gfield_checkbox input + label').click(function(){
							var fn = $(this);
							var chkbox = fn.siblings();
							chkbox.trigger('click');
						});				    
					} else {
				    // if ($('#input_'+formid+'_13').is(':visible') ) {
						var datepick = $('#ui-datepicker-div');

				    	$(".datepicker").hide().parent().datepicker({ 
				    		minDate: 0,
				    		dateFormat: 'mm/dd/yy',
			    		    onSelect: function(dateText, inst) { 
			    		    	$('#input_'+formid+'_13').val(inst.selectedMonth+1+'/'+inst.selectedDay+'/'+inst.selectedYear);
						    }
				    	});
					}

					// packages
					$('#input_'+formid+'_24 input:radio').change(function(){
					 	var fn = $(this);
					 	var pack = fn.val();
					 	$('.package_1, .package_2, .package_3, .package_custom').removeClass('active');
					 	$('.'+pack).addClass('active');
					 	$('.package_1 input, .package_2 input, .package_3 input, .package_custom input').attr("disabled", "disabled");
					 	$('.'+pack+' input').removeAttr("disabled", "disabled");
					 	fn.parent().addClass('active').siblings().removeClass('active');

					 	fn.siblings().text('SELECTED').parent().siblings().find('label').text('choose');
					});

					// colors
					$('#input_'+formid+'_17 input:checkbox').change(function(){
					 	var fn = $(this);

					 	// if not sure clicked
					 	if (fn.attr('id') == 'choice_17_16' && fn.is(':checked')) { 
					 		// clear all
							$('#input_'+formid+'_17 input:checkbox').each(function(){
								var chkbx = $(this);
								if (chkbx.attr('id') != 'choice_17_16') $(this).removeAttr('checked');
							});
					 	}
					 	// if other clicked
					 	if (fn.attr('id') != 'choice_17_16' && $('#choice_17_16').is(':checked')) {
					 		$('#choice_17_16').removeAttr('checked');
					 	}
					});

					$('.tooltip').tooltipster();

					$('#speak-planner a').colorbox({inline: true, width: "400px"});


					// set form to last step
					$('#gform_source_page_number_'+formid).val(4);
					$('#gform_target_page_number_'+formid).val(0);

				});

				</script>		
			</section>
		<?php flo_part('pagefooter');?>
	<?php endwhile; else: ?>
		<?php flo_part('notfound')?>
	<?php endif; ?>

	<div class="hidden">
		<div id="speak-to-planner">
			<h3>Speak <br/>to a Planner</h3>
			<p>Pick a package, choose your desired services,<br/>
				and fill out the questionnaire<br/>
				and a planner will contact you shortly
			</p>
		</div>
	</div>
</div>
<?php get_footer(); ?>