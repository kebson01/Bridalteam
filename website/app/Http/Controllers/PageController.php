<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Auth, View;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use App\Classes\WpApi;

use App\VendorCategory;
use App\Vendor;
use App\Page;

use App\MediaReview;
use App\MediaCategory;
use App\MediaTheme;
use App\MediaColor;
use App\Media;


use JWTAuth;

class PageController extends Controller{

    public function __construct(){
        try{
            $btvendortoken = $_COOKIE['btvendortoken'];        
            if($btvendortoken != ""){
                if ($user = JWTAuth::setToken($btvendortoken)->authenticate()) {                
                    View::share('user', $user);
                }
            }
        }catch(\Exception $e){
            View::share('user', null);
        }

        $wpapi = new WpApi();
        $menuitems = $wpapi->getMenu('main');
        $footermenuitms = $wpapi->getMenu("footer");
        $planmenu = $wpapi->getMenu("plan");
        $connectmenu = $wpapi->getMenu("connect");
        $companymenu = $wpapi->getMenu("company");
        View::share('menu', $menuitems);
        View::share('footermenu', $footermenuitms);
        View::share('planmenu', $planmenu);
        View::share('connectmenu', $connectmenu);
        View::share('companymenu', $companymenu);

    }

    public function showHomePage(){
        $wpapi = new WpApi();
        $page = $wpapi->getPage('home');
        $allcategories = VendorCategory::all();
        return view('home', [
            'categories' => $allcategories,
            'page' => $page
        ]);
    }

    public function showGalleryPage(){
        $initialmedia = Media::where('status', '=', 2)->orderBy('published_on', 'desc')->get();
        $mediacats = MediaCategory::where('parent_category', '=', 0)->get();
        $mediathemes = MediaTheme::all();
        $mediacolor = MediaColor::all();

        foreach($mediacats as $media){
            $media->subcats = $media->getChildCategories();
        }

        return view('gallery', [
            'categories' => $mediacats,
            'themes' => $mediathemes,
            'media' => $initialmedia,
            'colors' => json_encode($mediacolor)
        ]);
    }

    public function getPage($slug, Request $request){
        $wpapi = new WpApi();
        $page = $wpapi->getPage($slug);
        
        if($page){
            $view = "subpage";            
            if (isset($page->blogposts) && count($page->blogposts) > 0) {
                $view = "blog";
            }
            return view($view, [
                'page' => $page
            ]);
        }
    }

    public function showVendorCategories(){
        $allcategories = VendorCategory::all();
        return view('vendorcategories', [
            'categories' => $allcategories
        ]);
    }

    public function showVendorCategory($category){
        $category = VendorCategory::where("slug", "=", $category)->first();
        $vendors = Vendor::where('category', '=', $category->id)->where('approved', '=', true)->get();
        $questions = $category->getQuestions()->first();        

        return view('vendor.category', [
            'category' => $category,
            'vendors' => $vendors,
            'questions' => $questions
        ]);
    }

    public function showVendorLogin(){
        return view('vendor.login');
    }

    public function showVendorRegistration(){
        $wpapi = new WpApi();
        $page = $wpapi->getPage('home');
        $json = [
            "terms" => $page->acf->vendor_registration_terms
        ];
        return view('vendor.registration', [
            "pagejson" => json_encode($json)
        ]);
    }

    public function showVerification(Request $request){
        return view('vendor.verification');
    }

    public function showVendorPage($slug, Request $request){
        $vendor = Vendor::where('slug', "=", $slug)->where('approved', '=', true)->first();
        if($vendor){
            $category = VendorCategory::find($vendor->category);
            $vendor->media = $vendor->getMedia(6);
            return view('vendor.profile', [
                'vendor' => $vendor,
                'category' => $category
            ]);
        }else{
            return response()->view('vendor.404', [], 404);            
        }    
    }

    public function showVendorAccount(Request $request){
        $vendor = $request->user()->findVendor();
        if($vendor->isfirstlogin){
            return redirect('/vendor/firstrun');
        }else{
            $primarycategory = VendorCategory::find($vendor->category);
            $vendor->categoryname = $primarycategory->name;                
            $primaryquestions = $primarycategory->getQuestions();

            $secondaryquestions = array();
            $secondarycategory = null;
            
            if($vendor->secondarycategory){
                $secondarycategory = VendorCategory::find($vendor->secondarycategory);
                $vendor->secondarycategoryname = $secondarycategory->name;
                $secondaryquestions = $secondarycategory->getQuestions();
            }  

            

            return view('vendor.account',[
                'vendor' => $vendor,
                'primarycategory' => $primarycategory,
                'primaryquestions' => $primaryquestions,
                'secondarycategory' => $secondarycategory,
                'secondaryquestions' => $secondaryquestions,
                'currentsub' => $vendor->getSubscription(),
                'nextsub' => $vendor->getNextSubscription(),       
            ]);
        }        
    }

    public function showVendorFirstRun(Request $request){
        $vendor = $request->user()->findVendor();
        if($vendor->isfirstlogin){
            $primarycategory = VendorCategory::find($vendor->category);
            $vendor->categoryname = $primarycategory->name;                
            $primaryquestions = $primarycategory->getQuestions();

            $secondaryquestions = array();
            $secondarycategory = null;
            
            if($vendor->secondarycategory){
                $secondarycategory = VendorCategory::find($vendor->secondarycategory);
                $vendor->secondarycategoryname = $secondarycategory->name;
                $secondaryquestions = $secondarycategory->getQuestions();
            }  

            return view('vendor.firstrun', [
                'vendor' => $vendor,
                'primarycategory' => $primarycategory,
                'primaryquestions' => $primaryquestions,
                'secondarycategory' => $secondarycategory,
                'secondaryquestions' => $secondaryquestions
            ]);
        }else{
            return redirect('/vendor/account');
        }
    }

    public function logoutRedirect(Request $request) {
        return redirect("/gallery");
    }
}