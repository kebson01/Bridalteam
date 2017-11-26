<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\SubscriptionPricing;

use Laravel\Cashier\Billable;

class VendorSubscription extends Model
{
    use Billable;


    protected $table = 'vendor_subscriptions';
    protected $dates = ['nextrenewal_on', 'periodstarted_on'];
    
    public function getSubscriptionDetails(){
        return SubscriptionPricing::find($this->subscription_id);
    }
    
}