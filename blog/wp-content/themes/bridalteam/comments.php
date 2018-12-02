<?php
	// Do not delete these lines for security reasons
	if (!empty($_SERVER['SCRIPT_FILENAME']) && 'comments.php' == basename($_SERVER['SCRIPT_FILENAME'])) {
		die ('Please do not load this page directly. Thanks!');
	}
?>

	<a name="comments"></a>
	<section class="comments">
		<?php if (post_password_required()) : ?>
			<p class="comments-protected"><?php _e('This post is password protected. Enter the password to view comments.', 'flotheme'); ?></p>
		<?php
		return; endif; ?>

		<?php if (have_comments()) : ?>
			<ol class="commentlist">
				<?php wp_list_comments(array('callback' => 'flotheme_comment', 'max_depth' => 2)); ?>
			</ol>
			<?php if (get_comment_pages_count() > 1 && get_option('page_comments')) : // are there comments to navigate through ?>
				<nav class="comments-nav" class="pager">
					<div class="previous"><?php previous_comments_link(__('&larr; Older comments', 'flotheme')); ?></div>
					<div class="next"><?php next_comments_link(__('Newer comments &rarr;', 'flotheme')); ?></div>
				</nav>
			<?php endif; // check for comment navigation ?>

			<?php if (!comments_open() && !is_page() && post_type_supports(get_post_type(), 'comments')) : ?>
				<p class="comments-closed"><?php _e('Comments are closed.', 'flotheme'); ?></p>
			<?php endif; ?>
		<?php endif; ?>
		<?php if (!have_comments() && !comments_open() && !is_page() && post_type_supports(get_post_type(), 'comments')) : ?>
			<p class="comments-closed"><?php _e('Comments are closed.', 'flotheme'); ?></p>
		<?php endif; ?>
	</section>

	<?php if ( comments_open() && is_user_logged_in() ) : ?>
	<section class="respond cf">
		<a name="respond"></a>
		<!-- <h3><?php comment_form_title(__('Leave a Reply', 'flotheme'), __('Leave a Reply to %s', 'flotheme')); ?></h3><p class="cancel-comment-reply"><?php cancel_comment_reply_link(); ?></p> -->
			<form action="<?php echo get_option('siteurl'); ?>/wp-comments-post.php" method="post" class="comment-form">
				<p class="error"></p>
				<?php if (is_user_logged_in()) : ?>
				<?php else : ?>
					<div class="area1 ta">
						<label for="author"><?php _e('Name', 'flotheme'); if ($req) _e('*', 'flotheme'); ?></label>
						<input type="text" class="text" name="author" id="author" value="<?php echo esc_attr($comment_author); ?>" size="22" tabindex="1" <?php if ($req) echo "aria-required='true'"; ?> required="required">
						<label for="email"><?php _e('Email', 'flotheme'); if ($req) _e('*', 'flotheme'); ?></label>
						<input type="email" class="text" name="email" id="email" value="<?php echo esc_attr($comment_author_email); ?>" size="22" tabindex="2" <?php if ($req) echo "aria-required='true'"; ?> required="required" email="true">
						<label for="url"><?php _e('Website', 'flotheme'); ?></label>
						<input type="url" class="text" name="url" id="url" value="<?php echo esc_attr($comment_author_url); ?>" size="22" tabindex="3" required="required">
					</div>
				<?php endif; ?>
				<div class="area2 ta">
					<textarea placeholder="<?php _e('Comment', 'flotheme'); ?>" name="comment" id="comment" class="input-xlarge" tabindex="4" rows="5" cols="40" required="required"></textarea>
				</div>
				<div class="cf"></div>
				<div class="button">
					<input name="submit" class="submit" type="submit" tabindex="5" value="<?php _e('Leave Comment', 'flotheme'); ?>" />
				</div>
				<?php comment_id_fields(); ?>
				<?php do_action('comment_form', $post->ID); ?>
			</form>
	</section>
	<?php endif; ?>