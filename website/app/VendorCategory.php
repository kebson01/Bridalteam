<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\VendorQuestions;

class VendorCategory extends Model
{
    protected $table = 'vendors_categories';
    
    public function getQuestions(){
        return VendorQuestions::where('category', '=', $this->id)->get();
    }
    
}
