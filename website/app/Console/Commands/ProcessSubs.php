<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\VendorSubscription;
use App\VendorNextSubscription;
use App\VendorAddon;
use App\VendorNextAddon;
use App\SubscriptionAddon;
use App\Vendor;
use App\VendorCharge;
use App\User;

use Stripe;
use Carbon\Carbon;
use App\Classes\EmailSystem;


class ProcessSubs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'process:subs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Updating all expired subscriptions';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        //
        $expiredvendorsubs = VendorSubscription::where('nextrenewal_on', "<", date("Y-m-d"))->where("renewaltries", "<", 3)->get();
        $renewedSubCount = 0;
        $failedSubCount = 0;
        $totalSubCount = count($expiredvendorsubs);

        $errorlogs = "";
        
        foreach($expiredvendorsubs as $sub){
            try{
                $vendor = Vendor::find($sub->vendor_id);
                if($vendor){
                    $user = User::find($vendor->user_id);
                    if($user){
                        $charge = array();
                        $subscriptionchange = true;
                        $renewalsub = $vendor->getNextSubscription();
                        if($renewalsub == null){
                            $subscriptionchange = false;
                            $renewalsub = $vendor->getSubscription();
                        }

                        $charge = Stripe::charges()->create([
                            'customer' => $user->stripe_id,
                            'amount' => floatval($renewalsub->subtotal),
                            'currency' => 'USD',
                            'capture' => true
                        ]);

                        $vendorcharge = new VendorCharge;
                        $vendorcharge->vendor_id = $vendor->id;
                        $vendorcharge->charge_id = $charge['id'];
                        $vendorcharge->amount = floatval($renewalsub->subtotal);
                        $vendorcharge->stripe_networkstatus = $charge['outcome']['network_status'];
                        $vendorcharge->stripe_failreason = $charge['outcome']['reason'];
                        $vendorcharge->stripe_type = $charge['outcome']['type'];
                        $vendorcharge->stripe_risklevel = $charge['outcome']['risk_level'];
                        $vendorcharge->save();

                        if(isset($charge['paid']) && $charge['paid'] == true){
                            $currentdate = Carbon::now();
                            $sub->periodstarted_on = $currentdate;
                            $sub->nextrenewal_on = $currentdate->addMonths($renewalsub->duration);
                            if($subscriptionchange){
                                $sub->subscription_id = $renewalsub->id;
                            }
                            $sub->save();     

                            $vendor->expiration_date = $currentdate;
                            $vendor->save();

                            $existingaddons = VendorAddon::where('vendor_id', '=', $vendor->id)->get();
                            foreach($existingaddons as $addon){
                                $addon->delete();
                            }

                            if(count($renewalsub->addons) > 0){
                                foreach($renewalsub->addons as $addon){
                                    $addonpricing = SubscriptionAddon::where('duration', '=', intval($renewalsub->duration))->where('slug', '=', $addon->details->slug)->first();
            
                                    $vendoraddon = new VendorAddon;
                                    $vendoraddon->vendor_id = $vendor->id;
                                    $vendoraddon->vendorsubscription_id = $sub->id;
                                    $vendoraddon->addon_id = $addonpricing->id;
                                    $vendoraddon->save();
                                }
                            }

                            if($subscriptionchange){
                                $existingnextsub = VendorNextSubscription::where('vendor_id', '=', $vendor->id)->get();
                                foreach($existingnextsub as $sub){
                                    $sub->delete();
                                }

                                //Find any existing next addons for this vendor and remove them
                                $existingnextaddons = VendorNextAddon::where('vendor_id', '=', $vendor->id)->get();
                                foreach($existingnextaddons as $addon){
                                    $addon->delete();
                                }
                            }
                            $this->info("Vendor ID: " . $sub->vendor_id . " successfully renewed.");
                            $renewedSubCount++;
                        }else{
                            //Implement an attempt system - after 3 attempts then disable account
                            $sub->renewaltries++;
                            $sub->save();

                            if ($sub->renewaltries > 3) {
                                //Renewal tried 3 times, disable the account
                                $vendor->active = false;
                                $vendor->save();
                            }
                            $this->info("Vendor ID: " . $sub->vendor_id . " was NOT renewed.");
                            $failedSubCount++;
                            $errorlogs .= "Vendor ID: " . $sub->vendor_id . " was NOT renewed.<br/>";
                        }
                    }
                }                
            }catch(\Exception $e){   
                $this->info("There was an error renewing vendor ID: " . $sub->vendor_id . " - " . $e->getMessage() . ":" . $e->getLine());                
                $errorlogs .= "There was an error renewing vendor ID: " . $sub->vendor_id . " - " . $e->getMessage() . ":" . $e->getLine() . "<br/>";
                $failedSubCount++;

                $sub->renewaltries++;
                $sub->save();

                if ($sub->renewaltries > 3) {
                    //Renewal tried 3 times, disable the account
                    $vendor->active = false;
                    $vendor->save();
                }
            }   
        }

        $this->info(date("Y-m-d") . " - Renewed $renewedSubCount subscriptions out of $totalSubCount.  $failedSubCount failures.");

        $emailmsg = "Renewed $renewedSubCount subscriptions out of $totalSubCount" . "<br/>";
        $emailmsg .= "$failedSubCount subscription renewal failures.  Check logs:<br/><br/>";
        $emailmsg .= $errorlogs;

        //EmailSystem::sendAdminEmail("Daily Subscription Processing - " . date("Y-m-d"), $emailmsg);
    }
}
