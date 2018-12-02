<?php 
/**
 * Template Name: Template Contact
 */
// send contact
if (isset($_POST['contact'])) {
	$error = flo_send_contact($_POST['contact']);
}
get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
	<?php flo_part('pagehead');?>
		<section class="contact cf">
			<section class="story">
				<?php the_content();?>
			</section>
			<form method="post" action="<?php the_permalink();?>">
				<?php if (isset($_GET['success'])) : ?>
					<p class="success"><?php _e('Your email was sent successfully. Thank you for your message!', 'flotheme')?></p>
				<?php endif; ?>
				<?php if (isset($error) && isset($error['msg'])) : ?>
					<p class="error"><?php echo $error['msg']?></p>	
				<?php endif; ?>
				<p class="ta">
					<label for="contact-form-name"><?php _e('Name', 'flotheme')?><span>*</span></label>
					<input type="text" name="contact[name]" value="<?php echo isset($_POST['contact']['name']) ? $_POST['contact']['name'] : ''?>" required="required" id="contact-form-name" />
				</p>
				<p class="ta">
					<label for="contact-form-email"><?php _e('Email', 'flotheme')?><span>*</span></label>
					<input type="email" name="contact[email]" value="<?php echo isset($_POST['contact']['email']) ? $_POST['contact']['email'] : ''?>" required="required" id="contact-form-email" />
				</p>
				<p class="ta">
					<label for="contact-form-phone"><?php _e('Phone', 'flotheme')?></label>
					<input type="text" name="contact[phone]" value="<?php echo isset($_POST['contact']['phone']) ? $_POST['contact']['phone'] : ''?>" id="contact-form-phone" />
				</p>
				<p class="ta">
					<label for="contact-form-how"><?php _e('How did you find me?', 'flotheme')?></label>
					<input type="text" name="contact[how]" value="<?php echo isset($_POST['contact']['how']) ? $_POST['contact']['how'] : ''?>" id="contact-form-how" />
				</p>
				<p class="ta">
					<label for="contact-form-message"><?php _e('Message', 'flotheme')?></label>
					<textarea name="contact[message]"  id="contact-form-message" cols="40" rows="5" required="required"><?php echo isset($_POST['contact']['message']) ? $_POST['contact']['message'] : ''?></textarea>
				</p>
				<p class="submit">
					<input type="submit" value="Send" />
				</p>
				<?php wp_nonce_field() ?>
			</form>
		</section>
	<?php flo_part('pagefooter');?>
<?php endwhile; else: ?>
	<?php flo_part('notfound')?>
<?php endif; ?>
<?php get_footer(); ?>