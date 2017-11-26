<?php

namespace App;

use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

use App\Vendor;

class User extends Authenticatable
{
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'email', 'password',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    public function fullname(){
        return $this->firstname . " " . $this->lastname;
    }

    public function getVendors(){
        $vendors = Vendor::where("user_id", "=", $this->id)->get();
        return $vendors;
    }

    public function findVendor($id = null){
        if($id == null){
            $vendor = Vendor::where("user_id", "=", $this->id)->first();
        }else{
            $vendor = Vendor::where("user_id", "=", $this->id)->where('id', '=', $id)->first();            
        }
        
        return $vendor;
    }
}
