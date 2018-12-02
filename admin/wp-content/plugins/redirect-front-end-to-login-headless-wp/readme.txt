=== Redirect Front-end to Login | Headless WP ===
Contributors: bfintal, gambitph
Tags: headless, redirect, 401, 301, json, api, rest-api, rest, wp-api, wp-json
Requires at least: 4.7
Tested up to: 4.8.2
Stable tag: 1.0
Requires PHP: 5.2
License: GPLv3
License URI: https://www.gnu.org/licenses/gpl-3.0.html
Donate link: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=5A97UAY68JHY4

Redirects all front-end pages to the login page, best for building a headless WP REST API backend

== Description ==

Using WordPress entirely as a CMS (a [Headless WordPress](https://medium.com/@jchiatt/headless-wordpress-with-react-d573bca02ee0)) is a plausible option for people building web apps using technologies such as React JS or Angular JS to entirely build their front-end.

Doing this, the front-end (e.g. built with React) becomes decoupled from the back-end (e.g. WordPress). Since WordPress is being used strictly to manage and serve the content via REST API, the WP front-end becomes unusable and unnecessary - hence the term *"headless WordPress"*.

**This plugin essentially removes the front-end of WordPress.**

> Note that the REST API, and other non-front-end stuff should work as normal.

= Features =

* No settings page
* Allows backend access
* Allows REST API endpoints
* Redirects (403 Forbidden) all front-end pages to the login page

== Installation ==

1. Head over to Plugins > Add New in the admin
2. Search for "Headless WP"
3. Install & activate the plugin
4. Now your entire front-end (aside from the login page) will become inaccessible.

== Frequently Asked Questions ==

** How do I use WordPress with React?  **

[J.C. Hiatt](https://medium.com/@jchiatt) has an awesome post about it in Medium: [Headless WordPress with React](https://medium.com/@jchiatt/headless-wordpress-with-react-d573bca02ee0)

** What is React JS? **

I learned React from an article by [Per Harald Borgen](https://medium.com/@perborgen) in Medium called [Learn React.JS in 8 Minutes](https://medium.com/learning-new-stuff/learn-react-js-in-7-min-92a1ef023003)

== Upgrade Notice ==

None.

== Changelog ==

= v1.0 =

* Initial release
