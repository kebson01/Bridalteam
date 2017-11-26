<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use App\SubscriptionAddon;

class VendorNextAddon extends Model
{
    protected $table = 'vendor_nextaddon';

    public function getAddonDetails(){
        $addon = SubscriptionAddon::find($this->addon_id);
        return $addon;
    }
}
