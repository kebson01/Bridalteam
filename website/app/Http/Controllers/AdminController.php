<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use App\Vendor;
use App\VendorClaim;
use App\VendorCategory;
use App\VendorRegion;

use App\Media;
use App\MediaCategory;
use App\MediaColor;
use App\MediaTheme;
use App\MediaReview;

use Carbon\Carbon;

class AdminController extends Controller{
    public function getAllVendors(){
        $vendors = Vendor::all();
        $claims = VendorClaim::where('approved', '=', false)->get();

        return response()->json([
            'status' => "OK",
            'vendors' => $vendors,
            'claims' => $claims
        ]);
    }

    public function getClaim($id){
        $claim = VendorClaim::find($id);
        $origvendor = Vendor::find($claim->vendor_id);
        $categories = VendorCategory::all();
        $regions = VendorRegion::all();

        return response()->json([
            'status' => 'OK',
            'claim' => $claim,
            'origvendor' =>$origvendor,
            'regions' => $regions,
            'categories' => $categories,
        ]);
    }

    public function getVendor($id){
        $vendor = Vendor::find($id);
        $categories = VendorCategory::all();
        $regions = VendorRegion::all();

        $vendormedia = $vendor->getMedia();
        $imagecount = 0;
        $videocount = 0;

        foreach($vendormedia as $media){
            if($media->type == "image"){
                $imagecount++;
            }

            if($media->type == "video"){
                $videocount++;
            }
        }

        return response()->json([
            'status' => 'OK',
            'vendor' => $vendor,
            'regions' => $regions,
            'categories' => $categories,
            'currentsub' => $vendor->getSubscription(),
            'imagecount' => $imagecount,
            'videocount' => $videocount
        ]);
    }

    public function saveVendor($id, Request $request){
        $vendor = Vendor::find($id);
        if($vendor){
            $vendor->pcfirstname = $request->pcfirstname;
            $vendor->pclastname = $request->pclastname;
            $vendor->pcphone = $request->pcphone;
            $vendor->pcemail = $request->pcemail;
            
            $vendor->ownerfirstname = $request->ownerfirstname;
            $vendor->ownerlastname = $request->ownerlastname;
            $vendor->ownerphone = $request->ownerphone;
            $vendor->owneremail = $request->owneremail;
            
            $vendor->address = $request->address;
            $vendor->address2 = $request->address2;
            $vendor->city = $request->city;
            $vendor->state = $request->state;
            $vendor->zip = $request->zipcode;
            $vendor->country = $request->country;

            $vendor->businessname = $request->businessname;
            $vendor->url = $request->url;
            $vendor->about = $request->about;
            $vendor->services = $request->services;
            $vendor->minbudget = $request->minbudget;
            $vendor->maxbudget = $request->maxbudget;

            $vendor->category = intval($request->category);
            $vendor->secondarycategory = intval($request->secondarycategory);

            $vendor->region = $request->region;
            $vendor->save();

            return response()->json([
                'status' => 'OK',
            ]);
        }else{
            return response()->json(["status" => "Error", "message" => "Could not find vendor account."]);
        }
    }

    public function approveVendor($id){
        $vendor = Vendor::find($id);
        if($vendor){
            $vendor->approved = true;
            $vendor->approved_on = Carbon::now();
            $vendor->save();

            return response()->json([
                'status' => 'OK',
            ]);
        }else{
            return response()->json(["status" => "Error", "message" => "Could not find vendor account."]);
        }
    }

    public function disableVendor($id){
        $vendor = Vendor::find($id);
        if($vendor){
            $vendor->approved = false;
            $vendor->approved_on = null;
            $vendor->save();

            return response()->json([
                'status' => 'OK',
            ]);
        }else{
            return response()->json(["status" => "Error", "message" => "Could not find vendor account."]);
        }
    }

    public function getAllMedia(){
        $media = Media::with('vendor')->where('status', '=', 1)->get();

        return response()->json([
            'status' => 'OK',
            'media' => $media
        ]);
    }

    public function getAllMediaReview(){
        $mediareview = MediaReview::with('media')->with('vendor')->get();

        return response()->json([
            'status' => 'OK',
            'media' => $mediareview
        ]);
    }

    public function getMedia($id){
        $media = MediaReview::with('media')->with('vendor')->where('id', '=', $id)->first();

        $colors = MediaColor::all();
        $themes = MediaTheme::all();
        $categories = MediaCategory::all();

        return response()->json([
            'status' => 'OK',
            'media' => $media,
            'colors' => $colors,
            'themes' => $themes,
            'categories' => $categories
        ]);
    }

    public function saveMedia($id, Request $request){
        $media = Media::find($id);

        if($media){           
            $media->category = $request->category;
            $media->keyword = $request->keyword;
            $media->color = $request->color;
            $media->theme = $request->theme;
            $media->subcategories = json_encode($request->subcategories);
            $media->product_link = $request->product_link;                
            if(isset($request->isproduct)){
                if($request->isproduct == 1){
                    $media->isproduct = true;
                }else{
                    $media->isproduct = false;
                }
            }else{
                $media->isproduct = false;
            }

            $media->save();

            return response()->json([
                'status' => 'OK',
            ]);
        }else{
            return response()->json([
                'status' => 'OK',
            ]);
        }
    }

    public function approveMedia($id, Request $request){
        $mediareview = MediaReview::find($id);

        if($mediareview){
            if($request->review == "true"){
                $mediareview->approveMedia();
            }else{
                if($request->review == "false"){
                    $mediareview->rejectMedia($request->reviewcomments);
                }
            }
        }

        return response()->json([
            'status' => 'OK',
        ]);
    }
}