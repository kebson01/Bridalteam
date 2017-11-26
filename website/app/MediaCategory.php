<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class MediaCategory extends Model
{
    protected $table = 'wedfolio_categories';

    public function getChildCategories(){
        $childcategories = MediaCategory::where("parent_category", "=", $this->id)->get();
        return $childcategories;
    }
    
}