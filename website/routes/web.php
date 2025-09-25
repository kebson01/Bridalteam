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

// Debug route to test routing
Route::get('/test-route', function() {
    return 'Routing is working!';
});

Route::get('/vendor/login', function() {
    return 'Vendor login route is working! Controller: ' . class_exists('App\Http\Controllers\PageController') ? 'exists' : 'missing';
});

// Original route (temporarily commented)
// Route::get('/vendor/login', 'PageController@showVendorLogin');
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

// Catch-all route for custom pages (must be last)
Route::get('/{slug}', 'PageController@getPage')->where(['slug' => '^(?!vendor|api|admin|blog).*']);
