<!doctype html>
<!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 7]>    <html class="no-js lt-ie9 lt-ie8" <?php language_attributes(); ?>> <![endif]-->
<!--[if IE 8]>    <html class="no-js lt-ie9" <?php language_attributes(); ?>> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js" <?php language_attributes(); ?>> <!--<![endif]-->
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<title><?php wp_title('|', true, 'right'); bloginfo('name'); ?></title>
	<link href='http://fonts.googleapis.com/css?family=Raleway:400,700,500,600,300' rel='stylesheet' type='text/css'>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

	<div id="wrapper" <?php if (!is_mobile() && !is_front_page()) : ?>class="fixed"<?php endif; ?>>
		<!--[if lt IE 8]><p class="chromeframe">Your browser is <em>ancient!</em> <a href="http://browsehappy.com/">Upgrade to a different browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">install Google Chrome Frame</a> to experience this site.</p><![endif]-->
		<header id="header-main">
			<div class="wrapper">
				<a id="rel-top"></a>
				<h1 style="position: relative; left: 12px;">
					<a href="<?php echo home_url(); ?>/">
						<img src="<?php bloginfo('template_url')?>/images/logo.png" alt="<?php bloginfo('name'); ?>">
					</a>
				</h1>

				<nav id="nav-main" role="navigation">
					<?php wp_nav_menu(array(
						'menu'			=> 'Header Menu',
						'menu_class'	=> 'menu cf',
						'walker'		=> new Flotheme_Nav_Walker(),
						'container'		=> '',
					)); ?>
					<div class="cf"></div>

				</nav>
				

				<div id="top-buttons">
					<div id="search-holder" class="button">
						<?php get_search_form(true); ?>
						<a href="#searchform" id="lens-button"></a>
					</div>

					<?php if (!is_user_logged_in()) : ?>
						<div id="login" class="button">
							<a href="#loginform" href id="login-button">LOGIN</a>

							<?php flo_login_form('popup'); ?>
						</div>
					<?php else: ?>

					<?php endif; ?>

					<?php if (is_page('submit-your-venue')) : ?>
					<div id="speak-planner" class="button">
						<a href="<?php echo home_url('vendor-application'); ?>">Advertise With Us</a>
					</div>
					<?php elseif (is_page('vendor-application')) : ?>
					<div id="speak-planner" class="button">
						<a href="<?php echo home_url('submit-your-venue'); ?>">View Demo</a>
					</div>
					<?php elseif (is_page('services')) : ?>
					<div id="speak-planner" class="button">
						<a href="#speak-to-planner">Speak to a planner</a>
					</div>
					<?php else: ?>
					<div id="speak-planner" class="button">
						<a href="<?php echo home_url('services'); ?>">Speak to a planner</a>
					</div>
					<?php endif ;?>
				</div>
			</div>
		</header>
		<div id="content-main" role="main" class="wrapper">
