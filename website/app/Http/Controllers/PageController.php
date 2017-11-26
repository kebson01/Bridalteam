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
        View::share('menu', $menuitems);

    }

    public function showHomePage(){
        $allcategories = VendorCategory::all();
        return view('home', [
            'categories' => $allcategories
        ]);
    }

    public function showGalleryPage(){
        $initialmedia = MediaReview::with('media')->where('approved', '=', true)->get();
        return view('gallery', [
            'media' => $initialmedia
        ]);
    }

    public function getPage($slug, Request $request){
        $wpapi = new WpApi();
        $page = $wpapi->getPage($slug);
        
        if($page){
            return view('subpage', [
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
        $vendors = Vendor::where('category', '=', $category->id)->get();
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
        return view('vendor.registration');
    }

    public function showVerification(Request $request){
        return view('vendor.verification');
    }

    public function showVendorPage($slug, Request $request){
        $vendor = Vendor::where('slug', "=", $slug)->first();
        if($vendor){
            $category = VendorCategory::find($vendor->category);
            $vendor->media = $vendor->getMedia();
            return view('vendor.profile', [
                'vendor' => $vendor,
                'category' => $category
            ]);
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
}