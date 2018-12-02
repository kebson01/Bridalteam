jQuery(document).ready(function ($) {
	$.fn.flotheme_sliders_editor_shortcode = function() {
		$(this).each(function(){
			var select = $('#flotheme-slider-editor-shortcode-select');
			var settings = $('#flotheme-slider-editor-shortcode-settings');
			settings.hide();
			select.change(function(){
				if ('' == select.val()) {
					settings.hide();
					return;
				}
				settings.show();
			});
			$('#flotheme-slider-editor-shortcode-insert').click(function(e){
				e.preventDefault();
				window.send_to_editor(flotheme_generate_slider_shortcode(select.val(), settings.find('select')));
			});
		});		
	}
	$('#flotheme-slider-editor-shortcode-wrap').flotheme_sliders_editor_shortcode();
});