<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\Media;
use App\Vendor;

use Auth;
use Carbon\Carbon;

class MediaReview extends Model
{
    protected $table = 'vendor_mediareview';
    
    public function rejectMedia($reason){
        $media = Media::find($this->media_id);
        
        //$this->reviewer_id = Auth::user()->id;
        $this->approved = false;
        $this->reviewed = true;
        $this->reviewed_on = Carbon::now();
        $this->reason = $reason;
        $this->save();
        
        $media->status = 0;
        $media->save();        
    }
    
    public function approveMedia(){
        $media = Media::find($this->media_id);
        $vendor = Vendor::find($this->vendor_id);
        
        //$this->reviewer_id = Auth::user()->id;
        $this->approved = true;
        $this->reviewed = true;
        $this->reason = "";
        $this->reviewed_on = Carbon::now();        
        $this->save();
        
        $media->status = 2;
        
        $maximagesallowed = $vendor->getCurrentMediaImageLimit();
        
        if($maximagesallowed > 0){
            //Publish immediately
            $media->published_on = Carbon::now();    
        }else{
            //Publish on/after the next renewal date
            $currentsub = $vendor->getVendorSubscription();
            $media->published_on = $currentsub->nextrenewal_on;
        }        
        
        $media->save();
    }

    public function media(){
        return $this->belongsTo('App\Media', 'media_id');
    }

    public function vendor(){
        return $this->belongsTo('App\Vendor', 'vendor_id');
    }
    
}