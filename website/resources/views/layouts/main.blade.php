<!DOCTYPE html>
<html class="no-js">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Bridal Team</title>   
        <meta name="viewport" content="width=device-width">        
        
        <link href="https://fonts.googleapis.com/css?family=Catamaran" rel="stylesheet">
        <link href="/css/app.css" rel="stylesheet">

        <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.2.1.min.js"></script>
        <script src="https://use.typekit.net/gzu0qvd.js"></script>
        <script src="https://use.fontawesome.com/831d59b6f5.js"></script>        
        <script>try{Typekit.load({ async: true });}catch(e){}</script>         
        <script type="text/javascript" src="https://js.stripe.com/v2/"></script>
        <script type="text/javascript">
            Stripe.setPublishableKey('pk_test_zaJ3Zvbdy2m0aPUwPvjudqly');
        </script>        
        
        <script src="/js/all.js"></script>
        @yield('head')
    </head>
	<body>        
		<div id="wrapper">
            <header class="main">                
                <div class="innerwrapper">
                    <h1 id="logo">  
                        <a href="/"><img src="/img/logo.svg" alt="Bridal Team Wedding Planning" /></a>
                        <a id="betabadge">BETA</a>
                    </h1>
                    <nav id="mainmenu" class="main">
                        <!-- Menu Goes Here -->
                        <ul>
                            @foreach($menu as $menuitem)
                                <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                            @endforeach
                        </ul>
                        <?php if(!isset($_COOKIE['btvendortoken']) || $user == null): ?>
                            <a class="button" href="/vendor/login" id="btn_vendorlogin">Vendor Login</a>
                        <?php else: ?>
                            <div class="user_menu">  
                                <div class="userinfo">
                                    <img src="/img/user_ring_icon.svg" width="45" height="45">
                                    <div><span>Logged in as<br/><span class="name"><?php print $user->firstname . " " . $user->lastname; ?></span></span></div>
                                </div>          
                                <ul>
                                    <li><a href="/vendor/account">My Account</a></li>
                                    <li><a href="/vendor/<?php print $user->findVendor()->slug; ?>">My Vendor Profile</a></li>
                                    <li><a href="/logout">Logout</a></li>
                                </ul>
                            </div>
                        <?php endif; ?>
                    </nav>
                    <a id="mobilemenubtn">
                        <svg version="1.1"
                            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"
                            x="0px" y="0px" width="23px" height="15.3px" viewBox="0 0 23 15.3" style="enable-background:new 0 0 23 15.3;"
                            xml:space="preserve">
                            <defs>
                            </defs>
                            <path d="M0,0h23v2.6H0V0 M0,6.4h23v2.6H0V6.4 M0,12.8h23v2.6H0V12.8z"/>
                        </svg>
                    </a>
                </div>
            </header>
            @yield('page')
            <footer class="main">
                <div class="innerwrapper">
                    <div id="copyright">&copy; <?php print date("Y"); ?> Bridal Team</div>
                    <nav>
                        <ul>
                            @foreach($menu as $menuitem)
                                <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                            @endforeach
                        </ul>
                    </nav>
                </div>
            </footer>
        </div>
        <script src="/js/react/reactui.js"></script>
    </body>
</html>