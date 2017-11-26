<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

use App\SubscriptionAddon;

class VendorAddon extends Model
{
    protected $table = 'vendor_addons';

    public function getAddonDetails(){
        $addon = SubscriptionAddon::find($this->addon_id);
        return $addon;
    }
}
