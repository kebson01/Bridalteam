<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

//header('Access-Control-Allow-Origin: ' . env('ALLOW_ORIGIN'));
//header('Access-Control-Allow-Credentials: true');
//header('Access-Control-Allow-Methods: OPTIONS, POST, GET, PUT, DELETE');
//header('Access-Control-Allow-Headers: *');

Route::options('/{any}', function(){ return ''; })->where('any', '.*');

Route::group(['prefix' => 'v1'], function(){
    Route::group(['prefix' => 'user'], function(){
        Route::group(['middleware' => 'jwt.auth'], function(){
            Route::get('/', 'UserController@getUserDetails');
        });
    });

    Route::group(['prefix' => 'modals'], function(){
        Route::get('vendormessageform/{id}', 'VendorController@getVendorContactFormUI');
    });

    Route::group(['prefix' => 'vendors'], function(){        
        Route::get('/get/{slug}', 'VendorController@getVendor');
        Route::post('/login', 'VendorController@login');
        Route::get('/categories', 'VendorController@getCategories');
        Route::get('/categories/{slug}', 'VendorController@getCategory');
        Route::post('/filter', 'VendorController@filterVendors');
        Route::get('/regions', 'VendorController@getRegions');
        Route::post('/register', 'VendorController@registerVendor');
        Route::get('/verify', 'VendorController@verifyVendor'); 
        Route::post('/sendvendormessage/{id}', 'VendorController@sendVendorMessage');    
        Route::group(['middleware' => 'jwt.auth'], function(){
            Route::get('/me', 'VendorController@getVendorDetails');
            Route::post('/me', 'VendorController@updateVendor');
            Route::get('/welcome', 'VendorController@getVendorFirstRun');
            Route::post('/{id}/questions', 'VendorController@saveVendorQuestions');
            Route::post('/{id}/subscribe', 'VendorController@saveSubscription');
            Route::post('/{id}/changesubscription', 'VendorController@changeSubscription');
            Route::post('/{id}/cancelsubscription', 'VendorController@cancelSubscription');
            Route::post('/me/logo', 'VendorController@uploadVendorLogo');
            Route::post('/me/bg', 'VendorController@uploadVendorBackground');
            Route::get('/me/subscriptions', 'VendorController@getSusbcriptionDetails');
            Route::get('/me/messages', 'VendorController@getVendorMessages');
            Route::get('/me/message/{id}', 'VendorController@getVendorMessage');
        });
    });

    Route::group(['prefix' => 'media'], function(){
        Route::group(['middleware' => 'jwt.auth'], function(){
            Route::post('uploadmedia', 'MediaController@uploadMedia');
            Route::get('vendormedia', 'MediaController@getVendorMedia');
            Route::get('vendormedia/{id}', 'MediaController@getVendorMedia');
            Route::post('vendormedia/{id}', 'MediaController@saveVendorMedia');
            Route::delete('vendormedia/{id}', 'MediaController@deleteVendorMedia');
            Route::post('submitvendormedia/{id}', 'MediaController@submitVendorMedia');
        });
    });

    Route::group(['prefix' => 'admin'], function(){
        Route::get('/media', 'AdminController@getAllMedia');
        Route::get('/media/{id}', 'AdminController@getMedia');        
        Route::post('/media/{id}', 'AdminController@saveMedia');
        Route::post('/media/{id}/review', 'AdminController@approveMedia');
        Route::get('/vendors', 'AdminController@getAllVendors');
        Route::get('/mediareview', 'AdminController@getAllMediaReview');        
        Route::post('/importVendors', 'VendorController@importVendors');
    });
});

