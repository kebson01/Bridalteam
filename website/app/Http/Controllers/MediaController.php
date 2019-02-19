<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use App\MediaCategory;
use App\MediaColor;
use App\MediaTheme;
use App\Media;
use App\Vendor;
use App\MediaReview;

use Log;
use DB;
use Image;
use File;
use JWTAuth;


class MediaController extends Controller
{
    public function uploadMedia(Request $request){
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            
            if($vendor){                
                $path = $request->file('file')->store('public/media/' . $vendor->id);
                
                $pathinfo = pathinfo($path);      

                if(!File::exists(storage_path() . '/app/public/media/'. $vendor->id . '/thumb')){
                    File::makeDirectory(storage_path() . '/app/public/media/' . $vendor->id . '/thumb', 0775, true);
                }       

                $thumbdestinationpath = storage_path() . '/app/public/media/'.$vendor->id . '/thumb';
                $publicmediapath = '/media/' . $vendor->id; 
                
                //Generate thumbnail
                try{
                    Image::make(storage_path() . '/app/' . $path, array(
                        'width' => 400,
                        'height' => 400,
                        'crop' => false
                    ))->save($thumbdestinationpath . '/' . 'thumb_' . $pathinfo['basename']);
                } catch (\Exception $e) {
                    Log::alert($e->getMessage());
                    
                }
                
                
                Image::make(storage_path() . '/app/' . $path, array(
                    'width' => 400,
                    'height' => 400,
                    'crop' => true
                ))->save($thumbdestinationpath . "/" . "thumb_square_" . $pathinfo['basename']);
                
                $media = new Media;
                $media->path = $path;
                $media->thumbnailpath = $publicmediapath . '/thumb/thumb_' . $pathinfo['basename'];
                $media->urlpath = $publicmediapath . "/" . $pathinfo['basename'];
                $media->square_thumbnailpath = $publicmediapath . '/thumb/thumb_square_' .  $pathinfo['basename'];
                $media->type = "image";
                $media->status = 0;
                $media->vendor_id = $vendor->id;
                $media->isproduct = false;
                $media->order = $request->index;
                $media->save();
                
                return response()->json(["status" => "OK", "media" => $media]);
            }
        }        
    }

    public function getFilteredMedia(Request $request){
        $categoryid = $request->category;
        $keywords = $request->keyword;
        $theme = $request->theme;
        $color = $request->color;

        $query = Media::where("status", "=", 2);
        $query->where(function ($q) use($categoryid, $keywords, $theme, $color) {            
            if(!empty($categoryid)){
                $q->where('category', '=', $categoryid);
            }

            if(!empty($theme)){
                $q->where('theme', '=', $theme);
            }

            if(!empty($color)){
                $q->where('color', '=', $color);
            }

            if(!empty($keywords)){     
                $q->whereRaw("MATCH(keyword) AGAINST(? IN BOOLEAN MODE)", [$keywords]);                
            }
        });        

        $media = $query->get();

        return response()->json(["status" => "OK", "media" => $media]);        
    }


    public function getAllMedia(Request $request){
        $categories = $request->categories;
        $searchterms = $request->search;
        $allmedia = array();
        if(count($categories) > 0){
            $query = Media::where();
            $count = 0;
            foreach($categories as $cat){
                if($count == 0){                    
                    if(strpos($cat, "color_") !== false){
                        $query->where("color", "=", str_replace("color_", "", $cat));                        
                    }else{
                        if(strpos($cat, "theme_") !== false){
                            $query->where("theme", "=", str_replace("theme_", "", $cat));
                        }else{
                            $query->where("category", "LIKE", "%" . $cat . "%");   
                        }                            
                    }
                        
                }else{
                    if(strpos($cat, "color_") !== false){
                        $query->orWhere("color", "=", str_replace("color_", "", $cat));                        
                    }else{
                        if(strpos($cat, "theme_") !== false){
                            $query->orWhere("theme", "=", str_replace("theme_", "", $cat));
                        }else{
                            $query->orWhere("category", "LIKE", "%" . $cat . "%");   
                        }                            
                    }
                }
                $count++;                
            }
            if($searchterms != ""){
                $query->where('keyword', 'LIKE', $searchterms);
            }
            $media = $query->get();
            foreach($media as $m){
                if($m->status  == 2){
                    array_push($allmedia, $m);
                }
            }
            
        }else{
            $allmediaquery = Media::where("status", "=", 2);
            if($searchterms != ""){
                $allmediaquery->where('keyword', 'LIKE', $searchterms);
            }  

            $allmedia = $allmediaquery->get();
        }        
        
        return response()->json(["status" => "OK", "media" => $allmedia]);
    }

    public function getPublicMedia($id){
        $media = Media::find($id);
        if($media && $media->status == 2){
            $vendor = Vendor::find($media->vendor_id);
            $media->vendorname = $vendor->businessname;
            $media->vendorslug = $vendor->slug;

            if($media->color != null){
                $color = MediaColor::find($media->color);
                $media->color = $color->name;
            }

            if($media->theme != null){
                $theme = MediaTheme::find($media->theme);
                $media->theme = $theme->name;
            }

            return response()->json(["status" => "OK", "media" => $media]);
        }else{
            return response()->json([
                "status" => "Failed"
            ]);
        }
    }

    public function getVendorMedia($id = null){
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            if($vendor){
                $media = null;
                if($id == null){
                    $media = $vendor->getMedia();
                    $colors = MediaColor::all();
                    $themes = MediaTheme::all();
                    $categories = MediaCategory::all();
                    return response()->json([
                        "status" => "OK", "media" => $media,
                        "limit" => $vendor->getMonthlyMediaImageLimit(),
                        "colors" => $colors,
                        "themes" => $themes,
                        "categories" => $categories
                        ]);
                }else{
                    $media = $vendor->getMediaById($id);
                    $media->history = $media->getReviewHistory();
                    $colors = MediaColor::all();
                    $themes = MediaTheme::all();
                    $categories = MediaCategory::where("parent_category", "=", 0)->get();

                    foreach($categories as $cat){
                        $cat->subcategories = $cat->getChildCategories();
                        foreach($cat->subcategories as $subcat){
                            $subcat->subcategories = $subcat->getChildCategories();
                        }
                    }

                    return response()->json([
                        "status" => "OK",
                        "media" => $media,
                        "colors" => $colors,
                        "themes" => $themes,
                        "categories" => $categories
                        
                    ]);
                }                
                
            }else{
                return response()->json([
                    "status" => "Error", 
                    "message" => "Could not verify vendor account."
                ]);
            }
        }else{
            return response()->json([
                "status" => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }    
    }

    public function saveVendorMedia($id, Request $request){
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            if($vendor){
                $media = $vendor->getMediaById($id);
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
                    "status" => "OK"                    
                ]);
            }else{
                return response()->json([
                    "status" => "Error", 
                    "message" => "Could not verify vendor account."
                ]);
            }
        }
    }

    public function submitVendorMedia($id){
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            if($vendor){
                
                $media = $vendor->getMediaById($id);
                if($media != null){
                    $media->submitForReview(); 
                    return response()->json([
                        "status" => "OK",
                        "media" => $media           
                    ]);
                }else{
                    return response()->json([
                        "status" => "Error", 
                        "message" => "Could not find media."                   
                    ]);
                }
            }
        }

        return response()->json([
            "status" => "Error", 
            "message" => "Could not verify vendor account."
        ]);
    }

    public function deleteVendorMedia($id){
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            if($vendor){
                $media = $vendor->getMediaById($id);
                if($media != null){
                    $media->delete(); 
                    
                    return response()->json([
                        "status" => "OK"                    
                    ]);
                }else{
                    return response()->json([
                        "status" => "Error", 
                        "message" => "Could not find media."                   
                    ]);
                }
            }
        }

        return response()->json([
            "status" => "Error", 
            "message" => "Could not verify vendor account."
        ]);
    }
    
    public function getMedia($id){
        $media = Media::find($id);
        $vendor = Vendor::find($media->vendor_id);
        $color = MediaColor::find($media->color);
        $theme = MediaTheme::find($media->theme);
        
        $media->colorobj = $color;
        $media->themeobj = $theme;
        return response()->json(["status" => "OK", "media" => $media, "vendor" => $vendor]);
    }
    
    function regenerateMediaThumbnails(){
        $allmedia = Media::all();
        
        foreach($allmedia as $media){
            //Check if internal vendor media directory exists
            if(!File::exists(public_path() . '/media/'.$media->vendor_id . '/thumb')){
                File::makeDirectory(public_path() . '/media/' . $media->vendor_id . '/thumb', 0775, true);
            }
            
            $destinationpath = public_path() . '/media/'. $media->vendor_id;
            $thumbdestinationpath = public_path() . '/media/'. $media->vendor_id . '/thumb';    
            
            $publicmediapath = '/media/' . $media->vendor_id;       
            
            
            $image = Image::open(public_path() . $media->urlpath);  
            $filename = basename($media->path);
            
            //Generate thumbnails
            Image::make(public_path() . $media->urlpath, array(
                'width' => 400,
                'height' => 400,
                'crop' => false
            ))->save(public_path() . $media->thumbnailpath);
            
            Image::make(public_path() . $media->urlpath, array(
                'width' => 400,
                'height' => 400,
                'crop' => true
            ))->save($thumbdestinationpath . "/" . "thumb_square_" . $filename);
            $media->square_thumbnailpath = '/media/'. $media->vendor_id . '/thumb/' . "thumb_square_" . $filename;
            $media->save();
            
            
        }
    }
    
    function getMediaCategories(){
        $returncategories = array();
        
        $categories = MediaCategory::where("parent_category", "=", 0)->get();
        foreach($categories as $category){
            $subcategories = MediaCategory::where("parent_category", "=", $category->id)->get();                
            $category->subcategories = $subcategories;
            foreach($category->subcategories as $subcat){
                $subsubcategories = MediaCategory::where("parent_category", "=", $subcat->id)->get(); 
                $subcat->subcategories = $subsubcategories;
            }
            
            array_push($returncategories, $category);
        }
        
        $colorcategories = new MediaCategory;
        $colorcategories->name = "Colors";
        $colors = MediaColor::all();
        $colorsubcats = array();        
        foreach($colors as $color){
            $obj = new \stdClass();
            $obj->id = "color_" . $color->id;
            $obj->name = $color->name;
            $obj->color = $color->color;
            $obj->subcategories = array();
            array_push($colorsubcats, $obj);
        }
        $colorcategories->subcategories = $colorsubcats;
        $colorcategories->parent_category = 0;        
        array_push($returncategories, $colorcategories);
        
        $themecategories = new MediaTheme;
        $themecategories->name = "Themes";
        $themecategories->parent_category = 0;
        $themes = MediaTheme::all();
        $themesubcats = array();
        
        foreach($themes as $theme){
            $obj = new \stdClass();
            $obj->id = "theme_" . $theme->id;
            $obj->name = $theme->name;
            $obj->subcategories = array();
            array_push($themesubcats, $obj);
        }     
        
        $themecategories->subcategories = $themesubcats;  
        
        array_push($returncategories, $themecategories);        
        
        return response()->json(["status" => "OK", "categories" => $returncategories]);
    }
}
