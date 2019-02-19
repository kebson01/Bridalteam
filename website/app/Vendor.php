<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\Media;
use App\VendorSubscription;
use App\VendorNextSubscription;
use App\SubscriptionPricing;
use App\VendorMessage;

class Vendor extends Model
{
    protected $table = 'vendors';

    public function getSecondaryCategory(){

    }
    
    public function getMedia($take = null){
        $media = array();
        if($take == null){
            $media = Media::where("vendor_id", "=", $this->id)->get();
        }else{
            $media = Media::where("vendor_id", "=", $this->id)->take($take)->get();
        }        
        return $media;
    }

    public function getMediaById($id){
        $media = Media::where("vendor_id", "=", $this->id)->where('id', '=', $id)->first();
        return $media;
    }
    
    public function getSubscription(){
        $currentsub = VendorSubscription::where("vendor_id", "=", $this->id)->first();
        if($currentsub == null){
            return null;
        }else{
            $sub = $currentsub->getSubscriptionDetails();
            $sub->nextrenewal_on = $currentsub->nextrenewal_on;
            $sub->renewalattempts = $currentsub->renewaltries;
            $sub->addons = $this->getAddons();

            $subtotal = $sub->amount;
            foreach($sub->addons as $addon){
                $subtotal += $addon->details->amount;
            }
            $sub->subtotal = $subtotal;
            return $sub;   
        }             
    }

    public function getNextSubscription(){
        $nextsub = VendorNextSubscription::where("vendor_id", "=", $this->id)->first();
        if($nextsub == null){
            return null;
        }else{
            $sub = $nextsub->getSubscriptionDetails();
            $sub->periodstarts_on = $nextsub->periodstarts_on;
            $sub->addons = $this->getNextAddons();

            $subtotal = $sub->amount;
            foreach($sub->addons as $addon){
                $subtotal += $addon->details->amount;
            }
            $sub->subtotal = $subtotal;
            return $sub;   
        }  
    }

    public function getAddons(){
        $addons = VendorAddon::where("vendor_id", "=", $this->id)->get();
        if($addons == null){
            return null;
        }else{
            foreach($addons as $addon){
                $addon->details = $addon->getAddonDetails();
            }
            return $addons;
        }
    }

    public function getNextAddons(){
        $addons = VendorNextAddon::where("vendor_id", "=", $this->id)->get();
        if($addons == null){
            return null;
        }else{
            foreach($addons as $addon){
                $addon->details = $addon->getAddonDetails();
            }
            return $addons;
        }
    }

    public function hasAddon($slug){
        $addons = $this->getAddons();
        $hasaddon = false;
        foreach($addons as $addon){
            if($addon->details->slug == $slug){
                $hasaddon = true;
            }
        }

        return $hasaddon;
    }
    
    public function getVendorSubscription(){
        $currentsub = VendorSubscription::where("vendor_id", "=", $this->id)->first();
        return $currentsub;
    }
    
    public function getMonthlyMediaImageLimit(){
        $sub = $this->getSubscription();
        if ($this->id != 18202) {
            if($sub == null){
                return 3;
            }else{
                return $sub->imagelimit;    
            }
        } else {
            return 50;
        }
        
        
    }
    
    public function getCountOfMediaImagesForPeriod(){
        $currentsub = VendorSubscription::where("vendor_id", "=", $this->id)->first();
        if($currentsub == null){
            $images = Media::where("status", "=", 2)->where("vendor_id", "=", $this->id)->get();
            return $images->count();
        }else{
            $images = Media::where("status", "=", 2)->where("vendor_id", "=", $this->id)->whereDate("published_on", ">", $currentsub->periodstarted_on)->whereDate('published_on', "<", $currentsub->nextrenewal_on)->get();
            return $images->count();    
        }
        
    }
    
    public function getCurrentMediaImageLimit(){
        $maximages = $this->getMonthlyMediaImageLimit();
        $currentimages = $this->getCountOfMediaImagesForPeriod();
        
        return $maximages - $currentimages;
    }

    public function getMessages(){
        $messages = VendorMessage::where('vendor_id', '=', $this->id)->get();
        return $messages;
    }

    public function getMessage($id){
        $message = VendorMessage::where('vendor_id', '=', $this->id)->where('id', '=', $id)->first();
        $message->unread = false;
        $message->save();
        return $message;
    }
}
