<form role="search" method="get" id="searchform" action="<?php echo site_url()?>" >
    <fieldset>
    	<h2>Search:</h2>
        <input type="text" value="<?php echo get_search_query(); ?>" name="s" id="s" placeholder="<?php _e('Search', 'flotheme')?>" />
        <input type="submit" id="searchsubmit" value="<?php _e('Search', 'flotheme')?>" />
    </fieldset>
</form>