<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', 'PageController@showHomePage');

// Debug route
Route::get('/debug-route', function() {
    return 'Laravel routing is working!';
});

Route::get('/vendor/login', 'PageController@showVendorLogin');
Route::get('/vendor/register', 'PageController@showVendorRegistration');
Route::get('/email-verify', 'PageController@showVerification');
Route::get('/logout', 'PageController@logoutRedirect');

Route::group(['middleware' => 'vendortoken'], function(){
    Route::get('/vendor/account', 'PageController@showVendorAccount');
    Route::get('/vendor/firstrun', 'PageController@showVendorFirstRun');
});

Route::get('/vendors', 'PageController@showVendorCategories');
Route::get('/vendors/{category}', 'PageController@showVendorCategory');

// Vendor profile route (must be after specific /vendor/ routes)
Route::get('/vendor/{slug}', 'PageController@showVendorPage');

Route::get('/gallery', 'PageController@showGalleryPage');

// Blog route
Route::get('/blog', 'PageController@showBlogPage');

// --- Community: member auth pages (public) ---
Route::get('/community/register', 'CommunityController@showRegister');
Route::get('/community/login', 'CommunityController@showLogin');

// --- Community: public reads (soft auth for personalisation) ---
Route::group(['middleware' => 'optionaluser'], function () {
    Route::get('/community', 'CommunityController@showIndex');
    Route::get('/community/topic/{topic}', 'CommunityController@showTopic');
    Route::get('/community/thread/{slug}', 'CommunityController@showThread');
});

// --- Community: auth-gated compose page ---
Route::group(['middleware' => 'requireuser'], function () {
    Route::get('/community/new', 'CommunityController@showCompose');
});

// Catch-all route for custom pages (must be last)
Route::get('/{slug}', 'PageController@getPage')->where(['slug' => '^(?!vendor|api|admin|blog|community).*']);
