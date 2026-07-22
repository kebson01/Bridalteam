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
        Route::post('vendormessageform/{id}', 'VendorController@getVendorContactFormUI');
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

    Route::group(['prefix' => 'brides'], function(){
        //Public / social browsing (viewer is detected from the token if present)
        Route::post('/register', 'BrideController@registerBride');
        Route::post('/login', 'BrideController@login');
        Route::get('/explore', 'BrideController@getExplore');
        Route::get('/profile/{slug}', 'BrideController@getPublicProfile');
        Route::get('/board/{slug}', 'BrideController@getBoard');

        Route::group(['middleware' => 'jwt.auth'], function(){
            Route::get('/me', 'BrideController@getBrideDetails');
            Route::post('/me', 'BrideController@updateProfile');
            Route::post('/me/avatar', 'BrideController@uploadAvatar');
            Route::get('/feed', 'BrideController@getFeed');
            Route::get('/myboards', 'BrideController@getMyBoards');

            Route::post('/boards', 'BrideController@createBoard');
            Route::post('/boards/{id}/update', 'BrideController@updateBoard');
            Route::post('/boards/{id}/delete', 'BrideController@deleteBoard');
            Route::post('/boards/{id}/items', 'BrideController@addBoardItem');
            Route::post('/boards/{id}/items/remove', 'BrideController@removeBoardItem');
            Route::post('/boards/{id}/like', 'BrideController@likeBoard');
            Route::post('/boards/{id}/unlike', 'BrideController@unlikeBoard');
            Route::post('/boards/{id}/comments', 'BrideController@addComment');
            Route::post('/comments/{id}/delete', 'BrideController@deleteComment');

            Route::post('/follow/{id}', 'BrideController@followBride');
            Route::post('/unfollow/{id}', 'BrideController@unfollowBride');
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

        Route::get('public/{id}', 'MediaController@getPublicMedia');
        Route::post('public/filter', 'MediaController@getFilteredMedia');
    });

    Route::group(['prefix' => 'admin'], function(){
        Route::get('/media', 'AdminController@getAllMedia');
        Route::get('/media/{id}', 'AdminController@getMedia');        
        Route::post('/media/{id}', 'AdminController@saveMedia');
        Route::post('/media/{id}/review', 'AdminController@approveMedia');
        Route::get('/vendors/{id}', 'AdminController@getVendor');
        Route::get('/claims/{id}', 'AdminController@getClaim');
        Route::post('/claims/{id}/approve', 'VendorController@approveVendorClaim');
        Route::post('/vendors/{id}', 'AdminController@saveVendor');
        Route::post('/vendors/{id}/approve', 'AdminController@approveVendor');
        Route::post('/vendors/{id}/disable', 'AdminController@disableVendor');
        Route::get('/vendors', 'AdminController@getAllVendors');
        Route::get('/mediareview', 'AdminController@getAllMediaReview');        
        Route::post('/importVendors', 'VendorController@importVendors');
    });
});

