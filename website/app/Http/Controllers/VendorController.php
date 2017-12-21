<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use App\SubscriptionPricing;
use App\VendorCategory;
use App\User;
use App\Media;
use App\Vendor;
use App\VendorClaim;
use Carbon\Carbon;
use App\MediaCategory;
use App\MediaColor;
use App\MediaTheme;
use App\VendorRegion;
use App\VendorSubscription;
use App\VendorNextSubscription;
use App\VendorCharge;
use App\VendorAddon;
use App\VendorNextAddon;
use App\VendorMessage;
use App\SubscriptionAddon;

use App\Classes\EmailSystem;

use Auth;
use Hash;
use File;
use Image;
use Validator;
use JWTAuth;
use Excel;
use Log;

use Stripe;

class VendorController extends Controller
{
    public function getVendorDetails(){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor();
        if($vendor){
            $primarycategory = VendorCategory::find($vendor->category);
            $vendor->categoryname = $primarycategory->name;                
            $primaryquestions = $primarycategory->getQuestions();

            $secondaryquestions = array();
            if($vendor->secondarycategory){
                $secondarycategory = VendorCategory::find($vendor->secondarycategory);
                $vendor->secondarycategoryname = $secondarycategory->name;
                $secondaryquestions = $secondarycategory->getQuestions();
            }    
            return response()->json([
                'status' => "OK", 
                'vendor' => $vendor,
                'currentsub' => $vendor->getSubscription(),
                'nextsub' => $vendor->getNextSubscription(),
                'primaryquestions' => $primaryquestions,
                'secondaryquestions' => $secondaryquestions
            ]);
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    function getVendorMessages(){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor();
        if($vendor){            
            $messages = $vendor->getMessages();
            return response()->json([
                'status' => "OK",
                'messages' => $messages
            ]);
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    function getVendorMessage($id){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor();
        if($vendor){
            $messages = $vendor->getMessage($id);
            return response()->json([
                'status' => "OK",
                'message' => $messages
            ]);
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    public function getVendor($slug){
        $vendor = Vendor::where('slug', '=', $slug)->first();
        $vendor->media = $vendor->getMedia();
        $category = VendorCategory::find($vendor->category);
        return response()->json([
            'status' => "OK", 
            'vendor' => $vendor,
            'category' => $category
        ]);
    }

    public function login(Request $request){
        $credentials = $request->only('email', 'password');
                
        try {
            if (! $token = JWTAuth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            // something went wrong whilst attempting to encode the token
            return response()->json(['error' => 'could_not_create_token'], 500);
        }

        return response()->json([            
            'token' => $token
        ]);
    }
    
    public function getCategories(){
        $categories = VendorCategory::all();
        return response()->json(['categories' => $categories]);
    }

    private function filterVendorByAddons($vendors, $category){
        $filteredvendors = array();

        foreach($vendors as $vendor){
            //remove vendors that dont have double categories    
            if(!$vendor->hasAddon('addon_doublecat')){
                if($category->id == $vendor->category){
                    array_push($filteredvendors, $vendor);
                }
            }else{
                array_push($filteredvendors, $vendor);
            }
        }

        //add addon flags
        foreach($filteredvendors as $vendor){
            if(!$vendor->hasAddon('addon_featured')){
                $vendor->isfeatured = false;
            }else{
                $vendor->isfeatured = true;
            }

            if(!$vendor->hasAddon('addon_national')){
                $vendor->isnational = false;
            }else{
                $vendor->isnational = true;
            }
        }

        return $filteredvendors;
    }

    public function getCategory($slug){
        $category = VendorCategory::where('slug', '=', $slug)->first();        
        $vendors = Vendor::where('category', '=', $category->id)->orWhere('secondarycategory', '=', $category->id)->get();

        $filteredvendors = $this->filterVendorByAddons($vendors, $category);

        $searchregions = VendorRegion::all();
        $questions = $category->getQuestions();
        return response()->json([
            'status' => 'OK',
            'category' => $category,
            'vendors' => $filteredvendors,
            'searchregions' => $searchregions,
            'questions' => $questions
        ]);
    }

    public function getRegions(){
        $regions = VendorRegion::all();
        $searchregions = VendorRegion::all();
        return response()->json([
            'regions' => $regions,
            'searchregions' => $searchregions
        ]);
    }

    public function registerVendor(Request $request){
        //Validate fields        
        $lookforsubcatquestions = false;
        $valid = true;
        $err = "";
        foreach($request->all() as $field => $value){
            if($field != "address2" && $field != "secondcategory" && $field != "isNational" && $field != "claim"){
                if($value == ""){
                    $valid = false;
                    $err .= "Missing value for required field " . ucfirst($field) . "\n";
                }
            }
        }
        
        //Check to see if account already exists
        $existingaccount = User::where("email", "=", $request->pcontactemail)->first();
        if($existingaccount != null){
            $valid = false;
            $err .= "An account already exists for this email address: $request->pcontactemail";
        }

        if(!$valid){
            return response()->json(["status" => "Error", "message" => $err]);
        }  
        
        $user = new User;
        $user->email = $request->pcontactemail;
        $user->name = $request->pcontactemail;        
        $user->firstname = $request->pfirstname;
        $user->lastname = $request->plastname;
        $user->verification_code =  md5(uniqid($request->pcontactemail, true));
        $user->password = Hash::make($request->password);
        $user->save();
        
        $vendor = null;
        if($request->claim != null && $request->claim != ""){
            $vendor = new VendorClaim;
            $vendor->vendor_id = $request->claim;
        }else{
            $vendor = new Vendor;
        }
        
        $vendor->user_id = $user->id;
        $vendor->pcfirstname = $request->pfirstname;
        $vendor->pclastname = $request->plastname;
        $vendor->pcphone = $request->pcontactphone;
        $vendor->pcphoneext = $request->pcontactphoneext;
        $vendor->pcemail = $request->pcontactemail;
        
        $vendor->ownerfirstname = $request->ofirstname;
        $vendor->ownerlastname = $request->olastname;
        $vendor->ownerphone = $request->ocontactphone;
        $vendor->ownerphoneext = $request->ocontactphoneext;
        $vendor->owneremail = $request->ocontactemail;
        
        $vendor->address = $request->address1;
        $vendor->address2 = $request->address2;
        $vendor->city = $request->city;
        $vendor->state = $request->state;
        $vendor->zip = $request->zip;
        $vendor->country = $request->country;
        
        $vendor->businessname = $request->businessname;
        $vendor->url = $request->websiteurl;
        $vendor->minbudget = floatval($request->budgetfrom);
        $vendor->maxbudget = floatval($request->budgetto);
        
        if($request->claim == null){
            $vendor->showcitystate = true;
            $vendor->isFirstLogin = true;
            $vendor->source = "";
            $vendor->type = "";
            $vendor->slug = str_slug($vendor->businessname);
        }

        $vendor->region = $request->region;
        
        if($request->isNational){
            $vendor->isnational = true;
        }else{
            $vendor->isnational = false;
        }
                        
        $vendor->category = intval($request->category);
        $vendor->secondarycategory = intval($request->secondarycategory);
        $vendor->active = false;
        $vendor->approved = false;
        $vendor->save();
        
        if($request->claim != null && $request->claim != ""){
            $message = "<p>Your vendor profile claim has been submitted.  You will be contacted for additional information, or when your claim has been approved.</p>";
            EmailSystem::sendVendorClaimEmail($vendor->id, $message);

            $emailmsg = "A vendor claim has been received from $vendor->pcfirstname $vendor->pclastname <$user->email>.";
            EmailSystem::sendAdminEmail("Vendor Claim Received - " . $vendor->businessname, $emailmsg);
        }else{
            //Send verification email
            EmailSystem::sendVerificationEmail($vendor->id);
        }

        return response()->json(["status" => "OK"]);        
    }

    public function approveVendorClaim($id, Request $request){        
        $claim = VendorClaim::find($id);

        if($claim && $claim->approved == false){            
            $vendor = Vendor::find($claim->vendor_id);
            $vendor->user_id = $claim->user_id;
            $vendor->pcfirstname = $claim->pcfirstname;
            $vendor->pclastname = $claim->pclastname;
            $vendor->pcphone = $claim->pcphone;
            $vendor->pcphoneext = $claim->pcphoneext;
            $vendor->pcemail = $claim->pcemail;
            
            $vendor->ownerfirstname = $claim->ownerfirstname;
            $vendor->ownerlastname = $claim->ownerlastname;
            $vendor->ownerphone = $claim->ownerphone;
            $vendor->ownerphoneext = $claim->ownerphoneext;
            $vendor->owneremail = $claim->owneremail;
            
            $vendor->address = $claim->address;
            $vendor->address2 = $claim->address2;
            $vendor->city = $claim->city;
            $vendor->state = $claim->state;
            $vendor->zip = $claim->zip;
            $vendor->country = $claim->country;
            
            $vendor->businessname = $claim->businessname;
            $vendor->url = $claim->url;
            $vendor->minbudget = floatval($claim->minbudget);
            $vendor->maxbudget = floatval($claim->maxbudget);
            $vendor->region = $claim->region;
            $vendor->showcitystate = true;
            $vendor->isFirstLogin = true;            
            $vendor->slug = str_slug($vendor->businessname);

            if($claim->isNational){
                $vendor->isnational = true;
            }else{
                $vendor->isnational = false;
            }
                            
            $vendor->category = intval($claim->category);
            $vendor->secondarycategory = intval($claim->secondarycategory);
            $vendor->active = false;
            $vendor->approved = false;
            $vendor->save();

            $claim->approved = true;
            $claim->approved_on = Carbon::now();
            $claim->save();
            
            EmailSystem::sendVerificationEmail($vendor->id);

            return response()->json(["status" => "OK"]);       
        }else{
            return response()->json(["status" => "Error", "message" => "Could not find vendor claim."]);   
        }
    }

    public function updateVendor(Request $request){
        
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            if($vendor){
                $vendor->pcfirstname = $request->pcfirstname;
                $vendor->pclastname = $request->pclastname;
                $vendor->pcphone = $request->pcphone;
                $vendor->pcemail = $request->pcemail;
                
                $vendor->ownerfirstname = $request->ownerfirstname;
                $vendor->ownerlastname = $request->ownerlastname;
                $vendor->ownerphone = $request->ownerphone;
                $vendor->owneremail = $request->owneremail;
                
                $vendor->address = $request->address;
                $vendor->address2 = $request->address2;
                //$vendor->city = $request->city;
                //$vendor->state = $request->state;
                //$vendor->zip = $request->zipcode;
                //$vendor->country = $request->country;
                
                $vendor->businessname = $request->businessname;
                $vendor->url = $request->url;
                $vendor->about = $request->about;
                $vendor->services = $request->services;
                $vendor->minbudget = $request->minbudget;
                $vendor->maxbudget = $request->maxbudget;

                $vendor->region = $request->region;                
                
                if(isset($request->isnational) && $request->isnational == 1){
                    $vendor->isnational = true;
                }else{
                    $vendor->isnational = false;
                }

                if($request->showcitystate == "yes"){
                    $vendor->showcitystate = true;
                }else{
                    $vendor->showcitystate = false;
                }
                
                $vendor->faq = $request->faq;
                
                $vendor->slug = str_slug($vendor->businessname);
                $vendor->save();

                return response()->json(["status" => "OK"]);
            }            
        }else{
            return response()->json(["status" => "Error", "message" => "Could not verify vendor account."]);
        }
    }

    public function getVendorFirstRun(Request $request){
        $account = JWTAuth::parseToken()->authenticate();                
        if($account){
            $vendor = $account->findVendor();
            if($vendor){
                $token = JWTAuth::fromUser($account);

                $vendor->active = true;
                $now = Carbon::now();
                $now->addDays(90);
                $vendor->expiration_date = $now;
                $vendor->save();

                $primarycategory = VendorCategory::find($vendor->category);
                $vendor->categoryname = $primarycategory->name;                
                $primaryquestions = $primarycategory->getQuestions();

                $secondaryquestions = array();
                if($vendor->secondarycategory){
                    $secondarycategory = VendorCategory::find($vendor->secondarycategory);
                    $vendor->secondarycategoryname = $secondarycategory->name;
                    $secondaryquestions = $secondarycategory->getQuestions();
                }    
                //15 

                //Get subscription and addon pricing
                $subscriptions = SubscriptionPricing::all();
                $addons = SubscriptionAddon::all();
                
                return response()->json([
                    'status' => "OK", 
                    'account' => $account,
                    'vendor' => $vendor,
                    'primaryquestions' => $primaryquestions,
                    'secondaryquestions' => $secondaryquestions,
                    'subscriptions' => $subscriptions,
                    'addons' => $addons,
                    'token' => $token
                ]);
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

    public function saveVendorQuestions($id, Request $request){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor($id);
        if($vendor){

            $categoryquestions = array(
                "cat" => $request->cat,
                "subcat" => $request->subcat
            );

            $vendor->categoryquestions = json_encode($categoryquestions, JSON_FORCE_OBJECT);
            $vendor->save();

            return response()->json([
                'status' => "OK", 
            ]);
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    public function getSusbcriptionDetails(Request $request){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor();
        if($vendor){
            $subscriptions = SubscriptionPricing::all();
            $addons = SubscriptionAddon::all();
            return response()->json([
                'status' => 'OK',
                'subscriptions' => $subscriptions,
                'addons' => $addons,
                'currentsub' => $vendor->getSubscription()
            ]);
        }
        return response()->json([
            'status' => "Error", 
            "message" => "Could not verify vendor account."
        ]);
    }

    public function cancelSubscription($id, Request $request){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor($id);
        if($vendor){
            $subscription = $vendor->getVendorSubscription();
            $subscription->nextrenewal_on = null;
            $subscription->save();

            return response()->json([
                'status' => "OK"
            ]);
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    public function changeSubscription($id, Request $request){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor($id);
        if($vendor){            
            //Find any existing next subs for this vendor and remove them
            $existingnextsub = VendorNextSubscription::where('vendor_id', '=', $vendor->id)->get();
            foreach($existingnextsub as $sub){
                $sub->delete();
            }

            //Find any existing next addons for this vendor and remove them
            $existingnextaddons = VendorNextAddon::where('vendor_id', '=', $vendor->id)->get();
            foreach($existingnextaddons as $addon){
                $addon->delete();
            }

            $vendorsubscription = new VendorNextSubscription;
            $vendorsubscription->vendor_id = $vendor->id;
            
            $subscriptionprice = SubscriptionPricing::find($request->sub);
            $duration = $subscriptionprice->duration;
            $addons = array();

            foreach($request->addons as $aid){
                $addonobj = SubscriptionAddon::find($aid);
                array_push($addons, $addonobj->slug);            
            }

            $pricing = $this->calculateSubscriptionPrice($subscriptionprice->slug, $subscriptionprice->duration, $addons);           
            
            $vendorsubscription->subscription_id = $subscriptionprice->id;
            $vendorsubscription->periodstarts_on = $request->startson;
            $vendorsubscription->save();

            if(is_array($addons)){
                foreach($addons as $addon){
                    $addonpricing = SubscriptionAddon::where('duration', '=', intval($duration))->where('slug', '=', $addon)->first();

                    $vendoraddon = new VendorNextAddon;
                    $vendoraddon->vendor_id = $vendor->id;
                    $vendoraddon->vendornextsubscription_id = $vendorsubscription->id;
                    $vendoraddon->addon_id = $addonpricing->id;
                    $vendoraddon->save();
                }
            }

            return response()->json([
                'status' => "OK"                
            ]);
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    public function saveSubscription($id, Request $request){
        $account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor($id);
        if($vendor){
            $vendorsubscription = new VendorSubscription;

            $vendorsubscription->vendor_id = $vendor->id;
            
            $subscriptionprice = SubscriptionPricing::find($request->sub);
            $duration = $subscriptionprice->duration;
            $addons = array();

            foreach($request->addons as $aid){
                $addonobj = SubscriptionAddon::find($aid);
                array_push($addons, $addonobj->slug);            
            }

            $pricing = $this->calculateSubscriptionPrice($subscriptionprice->slug, $subscriptionprice->duration, $addons);           
            
            $vendorsubscription->subscription_id = $subscriptionprice->id;
            
            $paid = false;
            $charge = array();
            if(floatval($pricing['total']) > 0 && $request->cctoken != null){
                try{
                    //Create a stripe customer in which to save card info
                    $customer = Stripe::customers()->create([
                        'email' => $account->email,
                        'metadata' => array(
                            'user_id' => $account->id,
                            'vendor_id' => $vendor->id
                        )
                    ]);

                    $account->stripe_id = $customer['id'];
                    $account->save();

                    $card = Stripe::cards()->create($account->stripe_id, $request->cctoken);
                    $charge = Stripe::charges()->create([
                        'customer' => $account->stripe_id,
                        'amount' => floatval($pricing['total']),
                        'currency' => 'USD',
                        'capture' => true
                    ]);              
                    Log::info('charge result', $charge);      
                }catch(\Exception $e){                    
                    return response()->json([
                        'status' => "Error", 
                        "message" => "Could not complete subscription: " . $e->getMessage()
                    ]);
                }           

                $vendorcharge = new VendorCharge;
                $vendorcharge->vendor_id = $vendor->id;
                $vendorcharge->charge_id = $charge['id'];
                $vendorcharge->amount = floatval($pricing['total']);
                $vendorcharge->stripe_networkstatus = $charge['outcome']['network_status'];
                $vendorcharge->stripe_failreason = $charge['outcome']['reason'];
                $vendorcharge->stripe_type = $charge['outcome']['type'];
                $vendorcharge->stripe_risklevel = $charge['outcome']['risk_level'];
                $vendorcharge->save();
               
            }else{
                if(floatval($pricing['total']) == 0 && $request->cctoken == null){
                    //This is a free susbcription, pass them through
                    $paid = true;
                    $currentdate = Carbon::now();
                    $vendorsubscription->periodstarted_on = $currentdate;
                    $vendorsubscription->nextrenewal_on = $currentdate->addMonths($subscriptionprice->duration);
                    $vendorsubscription->save();  
                }
            }

            if(isset($charge['paid']) && $charge['paid'] == true){
                $paid = true;
                $currentdate = Carbon::now();
                $vendorsubscription->periodstarted_on = $currentdate;
                $vendorsubscription->nextrenewal_on = $currentdate->addMonths($subscriptionprice->duration);
                $vendorsubscription->save();     

                $vendor->expiration_date = $currentdate;
                
            }

            if($paid){
                if(is_array($addons)){
                    foreach($addons as $addon){
                        $addonpricing = SubscriptionAddon::where('duration', '=', intval($duration))->where('slug', '=', $addon)->first();

                        $vendoraddon = new VendorAddon;
                        $vendoraddon->vendor_id = $vendor->id;
                        $vendoraddon->vendorsubscription_id = $vendorsubscription->id;
                        $vendoraddon->addon_id = $addonpricing->id;
                        $vendoraddon->save();
                    }
                }

                $vendor->isfirstlogin = false;
                $vendor->save();

                
                EmailSystem::sendVendorReviewNotice($vendor->id);

                return response()->json([
                    'status' => "OK", 
                    'charge' => $charge
                ]);
            }else{
                if(isset($vendorcharge)){
                    return response()->json([
                        'status' => "Error", 
                        "message" => "Could not complete subscription.  Contact Bridal Team for support: " . $vendorcharge->stripe_failreason
                    ]);
                }else{
                    return response()->json([
                        'status' => "Error", 
                        "message" => "Could not complete subscription.  Contact Bridal Team for support: NO_CHARGE"
                    ]);
                }                
            }
        }else{
            return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
        }
    }

    public function importVendors(Request $request){
        if($request->importfile){
            $file = $request->importfile;
            

            Excel::load($file->getRealPath(), function($reader){
                $reader->take(10);
                $results = $reader->toArray();
                $categories = VendorCategory::all();
                $searchregions = VendorRegion::all();

                $index = 0;
                foreach($results as $row){
                    $foundregion = null;
                    foreach($searchregions as $region){
                        if(trim($region->region) == trim($row['region'])){
                            $foundregion = $region->id;
                            break;
                        }
                    }

                    $foundcategory = null;
                    foreach($categories as $category){
                        if(stristr($category->name, trim($row['category'])) != false){
                            $foundcategory = $category->id;
                            break;
                        }
                    }

                    if($foundcategory == null){
                        if(trim($row['category']) == "Travel Agency"){
                            $foundcategory = 17;
                        }
                        if(trim($row['category']) == "Stationary"){
                            $foundcategory = 15;
                        }
                    }
                    //Check for duplicates
                    $existing = Vendor::where('businessname', '=', trim($row['business_name']))->where('region', '=', $foundregion)->first();
                    if($existing != null){
                        print "Row $index: " . $row['business_name'] . " already exists in thsi region.  Skipping.<br/>";
                        continue;
                    }
                    $newvendor = new Vendor;
                    $newvendor->businessname = trim($row['business_name']);
                    $newvendor->slug = str_slug($newvendor->businessname);
                    $newvendor->pcemail = trim($row['email_address']);                    
                    $newvendor->source = trim($row['source']);
                    $newvendor->type = trim($row['type']);
                    $newvendor->region = $foundregion;
                    $newvendor->category = $foundcategory;                    

                    $newvendor->pcfirstname = "";
                    $newvendor->pclastname = "";
                    $newvendor->pcphone = "";
                    $newvendor->ownerfirstname = "";
                    $newvendor->ownerlastname = "";
                    $newvendor->ownerphone = "";
                    $newvendor->owneremail = "";
                    $newvendor->address = "";
                    $newvendor->city = "";
                    $newvendor->state = "";
                    $newvendor->zip = "";
                    $newvendor->country = "";
                    $newvendor->isnational = false;
                    $newvendor->url = "";
                    $newvendor->active = true;
                    $newvendor->showcitystate = false;
                    $newvendor->isFirstLogin = false;
                    $newvendor->approved = true;
                    $newvendor->approved_on = Carbon::now();
                    
                    if($newvendor->category != null){
                        //if($newvendor->region != null){
                        if(true){
                            $newvendor->save();
                        }else{
                            print "Could not save row $index: " . $row['business_name'] . " - Could not find search region for '" . $row['region'] . "'<br/>";
                        }
                    }else{
                        print "Could not save row $index: " . $row['business_name'] . " - Could not find category for '" . $row['category'] . "'<br/>";
                    }

                    $index++;
                }
                print "<br/><br/>Done.";
            });

        }
    }

    public function filterVendors(Request $request){
        $vendorresult = array();

        $isnational = false;
        $islocal = false;
        $state = null;
        $region = null;

        if(!empty($request->state)){
            $state = $request->state;
        }

        if(!empty($request->region)){
            $region = $request->region;
        }

        $vendorsquery = Vendor::where(function($query) use($request){
            $query->where('category', '=', intval($request->categoryid))->orWhere("secondarycategory", "=", intval($request->categoryid));
        });        

        if($state != null){
            $vendorsquery->where('state', '=', $state);
        }

        if($region != null){            
            $vendorsquery->where('region', '=', $region);
        }

        $vendors = $vendorsquery->get();
        $category = VendorCategory::find($request->categoryid);

        $filteredvendors = $this->filterVendorByAddons($vendors, $category);

        return response()->json(["status" => "OK", "results" => $filteredvendors]);
       
    }


	function uploadVendorLogo(Request $request){
       	$account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor();
        if($vendor){
	        $path = $request->file('file')->store('public/media/' . $vendor->id);
            $pathinfo = pathinfo($path); 
            
            $destinationpath = storage_path() . '/app/public/media/'.$vendor->id;
            $publicmediapath = '/media/' . $vendor->id; 
            
            Image::make(storage_path() . '/app/' . $path, array(
                'width' => 290,
                'height' => 290,
                'crop' => true
            ))->save($destinationpath . '/' . 'logo_' . $pathinfo['basename']);
            
            $vendor->logo = $publicmediapath . "/logo_" . $pathinfo['basename'];
            $vendor->save();
            
            return response()->json([
	            "status" => "OK",
	            "logopath" => $vendor->logo
            ]);
	    }else{
		    return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
	    }  	    
	    return response()->json([
            'status' => "Error", 
            "message" => "Could not verify vendor account."
        ]);   
    }

    function uploadVendorBackground(Request $request){
       	$account = JWTAuth::parseToken()->authenticate();
        $vendor = $account->findVendor();
        if($vendor){
	        $path = $request->file('file')->store('public/media/' . $vendor->id);
            $pathinfo = pathinfo($path); 
            
            $destinationpath = storage_path() . '/app/public/media/'.$vendor->id;
            $publicmediapath = '/media/' . $vendor->id; 
            
            Image::make(storage_path() . '/app/' . $path, array(
                'width' => 1920,
                'height' => 300,
                'crop' => true
            ))->save($destinationpath . '/' . 'bg_' . $pathinfo['basename']);
            
            $vendor->backgroundimage = $publicmediapath . "/bg_" . $pathinfo['basename'];
            $vendor->save();
            
            return response()->json([
	            "status" => "OK",
	            "bgpath" => $vendor->backgroundimage
            ]);
	    }else{
		    return response()->json([
                'status' => "Error", 
                "message" => "Could not verify vendor account."
            ]);
	    }  	    
	    return response()->json([
            'status' => "Error", 
            "message" => "Could not verify vendor account."
        ]);   
    }

    public function verifyVendor(Request $request){        
        $user = User::where('verification_code', '=', $request->verification)->first();
        if($user != null){
            $vendor = $user->findVendor($request->vid);
            if($vendor->active != true){                
                $vendor->active = true;                
                $vendor->save();
                return response()->json([
                    "status" => "OK"	            
                ]);
            }else{
                return response()->json([
                    "status" => "OK"	            
                ]);
            }                        
        }else{
            return response()->json([
                "status" => "Error",
                "message" => "Could not find user for this verification id."
            ]);
        }
    }










    //Old Endpoints
    //=============

    public function getCategoryQuestions(Request $request){
        $category = VendorCategory::find($request->category);
        $questions = $category->getQuestions();       
        
        if(count($questions) == 0){
            $emptyarray = array();
            return response()->json(["name" => $category->name, "questions" => $emptyarray]); 
        }else{
            return response()->json(["name" => $category->name, "questions" => $questions[0]]); 
        }
    }
    
    
    
    /*public function verifyVendor(Request $request){        
        $user = User::where('verification_code', '=', $request->verification)->first();
        if($user != null){
            foreach($user->getVendors() as $vendor){
                $vendor->active = true;
                $now = Carbon::now();
                $now->addDays(90);
                $vendor->expiration_date = $now;
                $vendor->save();
            }
            
            header("Location: " . env("DOMAIN") . "/vendors/registration/account-verified");
            exit();
        }
    }*/
    
    public function vendorLogin(Request $request){        
        if(Auth::attempt(['email' => $request->email, 'password' => $request->password])){            
            $creds = array();
            $creds['user_login'] = $request->email;
            $creds['user_password'] = $request->password;
            $creds['remember'] = true;
            $user = wp_signon( $creds, false );

            //If first login, redirect to final registration step
            if(Auth::user()->isFirstLogin){
                header("Location: " . env("DOMAIN") . "/vendors/vendor-details-registration");
                exit();
            }else{
                header("Location: " . env("DOMAIN") . "/vendor-account");
                exit();
            }           
        }else{
            header("Location: " . env("DOMAIN") . "/vendor-login?failed=true");
            exit();            
        }
    }
    
    

    public function updateVendorQuestions(Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            $categoryquestions = array(
                "cat" => $request->cat,
                "subcat" => $request->subcat
            );            
            
            $vendor->categoryquestions = json_encode($categoryquestions, JSON_FORCE_OBJECT);
            $vendor->isFirstLogin = false;
            $vendor->save();
            return response()->json(["status" => "OK"]);
        }else{
            return response()->json(["status" => "Error", "message" => "Could not verify vendor account."]);
        }
    }
    
    

    function getSubscriptionAddons(Request $request){
        $duration = explode('-', $request->subscription)[1];
        $addons = SubscriptionAddon::where('duration', '=', $duration)->get();

        return response()->json(["addons" => $addons]);
    }
    
    function getSubscriptionTotal(Request $request){
        $sub = explode('-', $request->sub);
        $addons = $request->addons;

        $returnpricing = $this->calculateSubscriptionPrice($sub, $addons);
        
        return json_encode($returnpricing);       
        
    }

    private function calculateSubscriptionPrice($sub, $duration, $addons){
        $total = 0.00;
        $returnpricing = array();

        $subscriptionprice = SubscriptionPricing::where("slug", "=", $sub)->where('duration', '=', intval($duration))->first();
        $returnpricing['subscriptionduration'] = $duration;
        $returnpricing['subscription'] = $subscriptionprice->name . " - " . $subscriptionprice->duration . " Month(s)";
        $returnpricing['subscriptionprice'] = $subscriptionprice->amount;
        $returnpricing['addons'] = array();

        $total += $subscriptionprice->amount;

        if(count($addons) > 0){
            foreach($addons as $addon){
                $addonpricing = SubscriptionAddon::where('duration', '=', intval($duration))->where('slug', '=', $addon)->first();
                $total += $addonpricing->amount;
                $addondetails = array(
                    'name' => $addonpricing->name,
                    'addonprice' => $addonpricing->amount
                );
                array_push($returnpricing['addons'], $addondetails);
            }
        }
        
        $returnpricing['total'] = $total;

        return $returnpricing;
    }

    function getVendorMessageDetail(Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            if($vendor->getSubscription() != null){
                $message = VendorMessage::find($request->msgid);
                if($message != null){
                    $message->unread = false;
                    $message->save();
                    return response()->json(["status" => "OK", "details" => $message->messagejson]);
                }else{
                    return response()->json(["status" => "Error", "message" => "Message not found."]);
                }
            }else{
                return response()->json(["status" => "Error", "message" => "Free accounts cannot read messages."]);
            }
            
        }else{
            return response()->json(["status" => "Error", "message" => "Vendor not found."]);
        }
    }
    
    function uploadMedia(Request $request){        
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            //Check if internal vendor media directory exists
            if(!File::exists(public_path() . '/media/'.$vendor->id . '/thumb')){
                File::makeDirectory(public_path() . '/media/' . $vendor->id . '/thumb', 0775, true);
            }
            
            $destinationpath = public_path() . '/media/'.$vendor->id;
            $thumbdestinationpath = public_path() . '/media/'.$vendor->id . '/thumb';    
            
            $publicmediapath = '/media/' . $vendor->id;       
            
            
            $image = $request->file;
            $image->move($destinationpath, urlencode(strtolower($image->getClientOriginalName())));
            
            //Generate thumbnail
            Image::make($destinationpath . '/' . urlencode(strtolower($image->getClientOriginalName())), array(
                'width' => 400,
                'height' => 400,
                'crop' => false
            ))->save($thumbdestinationpath . '/' . 'thumb_' . urlencode(strtolower($image->getClientOriginalName())));
            
            Image::make($destinationpath . '/' . urlencode(strtolower($image->getClientOriginalName())), array(
                'width' => 400,
                'height' => 400,
                'crop' => true
            ))->save($thumbdestinationpath . "/" . "thumb_square_" . urlencode(strtolower($image->getClientOriginalName())));
            
            $media = new Media;
            $media->path = $destinationpath . '/' . urlencode(strtolower($image->getClientOriginalName()));
            $media->thumbnailpath = $publicmediapath . '/thumb/thumb_' . urlencode(strtolower($image->getClientOriginalName()));
            $media->urlpath = $publicmediapath . '/' . urlencode(strtolower($image->getClientOriginalName()));
            $media->square_thumbnailpath = $publicmediapath . '/thumb/thumb_square_' . urlencode(strtolower($image->getClientOriginalName()));
            $media->type = "image";
            $media->status = 0;
            $media->vendor_id = $vendor->id;
            $media->save();
            
            
            return response()->json(["status" => "OK", "media" => $media]);
            
        }
        
        
    }

    

    function sendVendorMessage($id, Request $request){
        $vendor = Vendor::find($id);
        if($vendor != null){
            $message = new VendorMessage;
            $message->vendor_id = $vendor->id;

            if(!empty($request->brideid)){
                $message->senderbride_id = $request->brideid;
            }else{                
                $message->sender_email = $request->email;
            }

            $message->sender_firstname = $request->firstname;
            $message->sender_lastname = $request->lastname;
            

            $msgjson = array(
                "firstname" => $request->firstname,
                "lastname" => $request->lastname,
                "email" => $request->email,
                "brideid" => $request->brideid,
                "eventtype" => $request->eventtype,
                "othereventtype" => $request->othereventtype,
                "eventdate" => $request->eventdate,
                "message" => $request->message
            );

            $message->messagejson = json_encode($msgjson);
            $message->unread = true;
            $message->save();

            //Based on vendor level, send message to vendor
            $domain = env('WEBDOMAIN');
            $message = "<p>You have a new message from " . $request->firstname . " " . $request->lastname . "</p>";
            $message .= "<p>To view, log in to your account: <a href='" . $domain . "/vendor/account?tab=messages'>View Message</a></p>";
            EmailSystem::sendVendorEmail($vendor->id, $message);
            return response()->json(["status" => "OK"]);

        }else{
            return response()->json(["status" => "Error", "message" => "Vendor not found."]);
        }
        
    }

    function getVendorContactFormUI($id, Request $request){
        $vendor = Vendor::find($id);
        $bride = [
            'brideid' => '',
            'bridefirstname' => '',
            'bridelastname' => ''
        ];

        if(!empty($request->btpmstoken)){
            $client = new \GuzzleHttp\Client();
            $response = $client->post(env('PMSDOMAIN') . '/api/validateBride', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $request->btpmstoken
                ],
                'body' => ''
            ]);
            $responsebody = json_decode($response->getBody());    

            $bride['brideid'] = $responsebody->brideid;
            $bride['bridefirstname'] = $responsebody->bridefirstname;
            $bride['bridelastname'] = $responsebody->bridelastname;
        }
        
        $html = view('modals.vendorcontactform', ['vendor' => $vendor, 'bride' => $bride])->render();
        return response()->json(["status" => "OK", "ui" => $html]);
    }
    
    function getMediaEditorUI($id, Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            $media = Media::find($id);
            $colors = MediaColor::all();
            $themes = MediaTheme::all();
            $categories = MediaCategory::where("parent_category", "=", 0)->get();
            foreach($categories as $category){
                $subcategories = MediaCategory::where("parent_category", "=", $category->id)->get();                
                $category->subcategories = $subcategories;
                foreach($category->subcategories as $subcat){
                    $subsubcategories = MediaCategory::where("parent_category", "=", $subcat->id)->get(); 
                    $subcat->subcategories = $subsubcategories;
                }
            }
            
                        
            $html = view('vendor.partialeditmedia', ['webdomain' => env('WEBDOMAIN'), 'vendor' => $vendor, 'media' => $media, 'colors' => $colors, 'themes' => $themes, 'categories' => $categories])->render();
            return response()->json(["status" => "OK", "ui" => $html]);            
        }
    }
    
    function saveMedia(Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            $media = Media::find($request->mid);
            
            if($media == null){
                return response()->json(["status" => "Error", "message" => "Media not found"]);
            }else{
                $media->category = json_encode($request->mediacats);
                $media->keyword = $request->keywords;
                $media->color = $request->mediacolor;
                $media->theme = $request->mediatheme;
                if(isset($request->isproduct)){
                    if($request->isproduct == "true"){
                        $media->isproduct = true;
                    }else{
                        $media->isproduct = false;
                    }
                }else{
                    $media->isproduct = false;
                }
                $media->save();
                
                return response()->json(["status" => "OK"]);
            }
        }
    }
    
    function deleteMedia(Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            $media = Media::find($request->mid);
            
            if($media == null){
                return response()->json(["status" => "Error", "message" => "Media not found"]);
            }else{
                $media->delete();
                return response()->json(["status" => "OK"]);
            }
        }
    }
    
    function getMedia(Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            return response()->json(['status' => "OK", "media" => $vendor->getMedia()]);
        }
    }
    
    function submitMediaForReview(Request $request){
        $user = User::where("wp_id", "=", $request->uid)->first();
        $vendor = Vendor::find($request->vid);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            $media = Media::find($request->mid);
            
            if($media == null){
                return response()->json(["status" => "Error", "message" => "Media not found"]);
            }else{
                $media->submitForReview();                
                return response()->json(["status" => "OK"]);
            }
        }
    }
    
    function submitSubscription(Request $request){

        $user = User::where("wp_id", "=", $request->vendordetails['uid'])->first();
        $vendor = Vendor::find($request->vendordetails['vid']);
        
        if(($vendor && $user) && ($user->id == $vendor->user_id)){
            $vendorsubscription = new VendorSubscription;

            $vendorsubscription->vendor_id = $vendor->id;
            $sub = explode('-', $request->subdetails['sub']);            
            $addons = $request->subdetails['addons'];

            $pricing = $this->calculateSubscriptionPrice($sub, $addons);

            $subscriptionprice = SubscriptionPricing::where("slug", "=", $sub[0])->where('duration', '=', $sub[1])->first();
            $vendorsubscription->subscription_id = $subscriptionprice->id;
            $vendorsubscription->save();

            if(floatval($pricing['total']) > 0){
                $charge = Stripe::charges()->create([
                    'source' => $request->cctoken,
                    'amount' => floatval($pricing['total']),
                    'currency' => 'USD',
                    'capture' => true
                ]);

                $vendorcharge = new VendorCharge;
                $vendorcharge->vendor_id = $vendor->id;
                $vendorcharge->charge_id = $charge['id'];
                $vendorcharge->amount = floatval($pricing['total']);
                $vendorcharge->save();
               
            }

            $currentdate = Carbon::now();
            $vendorsubscription->periodstarted_on = $currentdate;
            $vendorsubscription->nextrenewal_on = $currentdate->addMonths($subscriptionprice->duration);
            $vendorsubscription->save();           

            if(is_array($addons)){
                foreach($addons as $addon => $duration){
                    $addonpricing = SubscriptionAddon::where('duration', '=', intval($duration))->where('slug', '=', $addon)->first();

                    $vendoraddon = new VendorAddon;
                    $vendoraddon->vendor_id = $vendor->id;
                    $vendoraddon->vendorsubscription_id = $vendorsubscription->id;
                    $vendoraddon->addon_id = $addonpricing->id;
                    $vendoraddon->save();
                }
            }

            

            return response()->json(["status" => "OK"]);
        }
    }
}
