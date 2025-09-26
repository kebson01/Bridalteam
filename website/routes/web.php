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

// Health check for Cloud Run
Route::get('/healthz', function(){ return 'ok'; });

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
Route::get('/vendor/{slug}', 'PageController@showVendorPage');

Route::get('/gallery', 'PageController@showGalleryPage');
Route::get('/{slug?}', 'PageController@getPage')->where(['slug' => '.*']);
