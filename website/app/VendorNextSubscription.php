<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\SubscriptionPricing;

use Laravel\Cashier\Billable;

class VendorNextSubscription extends Model
{
    use Billable;


    protected $table = 'vendor_nextsubscription';
    protected $dates = ['periodstarts_on'];
    
    public function getSubscriptionDetails(){
        return SubscriptionPricing::find($this->subscription_id);
    }
    
}