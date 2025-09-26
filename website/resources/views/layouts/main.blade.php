<!DOCTYPE html>
<html class="no-js">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">        
        @yield('title')
        <meta name="viewport" content="width=device-width">        
        
        <link rel="stylesheet" href="https://use.typekit.net/gzu0qvd.css">
        <link href="https://fonts.googleapis.com/css?family=Catamaran" rel="stylesheet">
        <link href="/css/app.css" rel="stylesheet">

        <script src="https://ajax.aspnetcdn.com/ajax/jQuery/jquery-3.3.1.min.js"></script>
        <script src="https://code.jquery.com/jquery-migrate-3.0.0.min.js"></script>
        <script src="https://use.typekit.net/gzu0qvd.js"></script>
        <script src="https://use.fontawesome.com/831d59b6f5.js"></script>        
        <script>try{Typekit.load({ async: true });}catch(e){}</script>         
        <script type="text/javascript" src="https://js.stripe.com/v2/"></script>
        <script type="text/javascript">
            Stripe.setPublishableKey('<?php print env("STRIPE_KEY"); ?>');
        </script>       
        <!-- Google Analytics -->
        <script>
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
            
            ga('create', 'UA-63664179-1', 'auto');
            ga('send', 'pageview');
        </script>
        <!-- End Google Analytics --> 
        
        <script src="/js/all.js"></script>
        @yield('head')
    </head>
	<body>        
		<div id="wrapper">
            <header class="main">                
                <div class="innerwrapper">
                    <h1 id="logo">  
                        <a href="/"><img src="/img/logo.svg" alt="Bridal Team Wedding Planning" /></a>                        
                    </h1>
                    <nav id="mainmenu" class="main">
                        <!-- Menu Goes Here -->
                        <ul>
                            @if(isset($menu) && is_array($menu) && count($menu) > 0)
                                @foreach($menu as $menuitem)
                                    <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                                @endforeach
                            @else
                                <!-- Fallback navigation for better UX when WP menu is unavailable -->
                                <li><a href="/">Home</a></li>
                                <li><a href="/gallery">Gallery</a></li>
                                <li><a href="/vendors">Vendors</a></li>
                                <li><a href="/blog">Blog</a></li>
                            @endif
                        </ul>
                        <?php if(!isset($_COOKIE['btvendortoken']) || $user == null): ?>
                            <a class="button" href="{{ url('/vendor/login') }}" id="btn_vendorlogin">User Login</a>
                        <?php else: ?>
                            <div class="user_menu">  
                                <div class="userinfo">
                                    <img src="/img/user_ring_icon.svg" width="45" height="45">
                                    <div><span>Logged in as<br/><span class="name"><?php print $user->firstname . " " . $user->lastname; ?></span></span></div>
                                </div>          
                                <ul>
                                    <li><a href="/vendor/account">My Account</a></li>
                                    <li><a href="/vendor/<?php print $user->findVendor()->slug; ?>">My Vendor Profile</a></li>
                                    <li><a class="logout_btn" href="/logout">Logout</a></li>
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
                    <div class="footercolumns">
                        <div class="col">
                            <h4>Plan</h4>
                            <ul>
                                @foreach($planmenu as $menuitem)
                                    <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                                @endforeach                                 
                            </ul>
                        </div>
                        <div class="col">
                            <h4>Connect</h4>
                            <ul>
                                @foreach($connectmenu as $menuitem)
                                    <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                                @endforeach 
                            </ul>
                        </div>
                        <div class="col">
                            <h4>Company</h4>
                            <ul>
                                @foreach($companymenu as $menuitem)
                                    <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                                @endforeach 
                            </ul>
                        </div>
                        <div class="col socialmedia">
                            <h4>Social Media</h4>
                            <a target="_blank" href="https://www.facebook.com/bridalteam"><i class="fa fa-facebook" aria-hidden="true"></i></a>
                            <a target="_blank" href="http://twitter.com/bridalteam"><i class="fa fa-twitter" aria-hidden="true"></i></a>
                            <a target="_blank" href="https://www.instagram.com/bridalteam"><i class="fa fa-instagram" aria-hidden="true"></i></a>
                            <a target="_blank" href="https://www.pinterest.com/bridalteam"><i class="fa fa-pinterest" aria-hidden="true"></i></a>
                        </div>
                    </div>                                        
                </div>
                <div id="copyright">
                    <div class="innerwrapper"> 
                        <nav>
                            <ul>
                                @foreach($footermenu as $menuitem)
                                    <li><a href="{{$menuitem->url}}">{{$menuitem->title}}</a></li>
                                @endforeach                            
                            </ul>
                        </nav>
                        <div class="copyright">&copy; <?php print date("Y"); ?> Bridal Team</div>
                    </div>
                </div>
            </footer>
        </div>
        <script src="/js/react/reactui.js"></script>
    </body>
</html>