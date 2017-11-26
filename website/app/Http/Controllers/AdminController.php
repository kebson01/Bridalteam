<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use App\Vendor;
use App\VendorClaim;

use App\Media;
use App\MediaCategory;
use App\MediaColor;
use App\MediaTheme;
use App\MediaReview;

class AdminController extends Controller{
    public function getAllVendors(){
        $vendors = Vendor::all();

        return response()->json([
            'status' => "OK",
            'vendors' => $vendors,
            'claims' => array()
        ]);
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