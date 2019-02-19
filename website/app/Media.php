<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\MediaReview;
use App\Vendor;

use App\Classes\EmailSystem;

class Media extends Model
{
    use SoftDeletes;
    
    protected $table = 'vendor_media';
    protected $dates = ['deleted_at', 'published_on'];
    
    public function getReviewHistory(){
        $history = MediaReview::where("media_id", "=", $this->id)->get();        
        return $history;
    }
    
    public function submitForReview(){
        $review = new MediaReview;
        $review->media_id = $this->id;
        $review->vendor_id = $this->vendor_id;

        if ($this->vendor_id == 18202) {
            $review->reviewed = true;
            $review->approved = true;
            $this->status = 2;
        } else {
            $review->reviewed = false;
            $review->approved = false;
            $this->status = 1;
        }
        
        $review->save();
        
        
        $this->save();
        if ($this->vendor_id != 18202) {
            $emailmsg = "A image/video has been submitted for review from " . $this->vendor()->businessname . " Access the admin portal to review.";
            EmailSystem::sendAdminEmail("Media Review Requested - " . $this->vendor()->businessname, $emailmsg);
        }
        
    }
    
    public function isUnderReview(){
        $activereview = MediaReview::where("media_id", "=", $this->id)->where("reviewed", "=", false)->get();
        if($activereview->count > 0){
            return true;
        }else{
            return false;
        }
    }

    public function vendor(){
        return Vendor::find($this->vendor_id);
    }
    
    
}
