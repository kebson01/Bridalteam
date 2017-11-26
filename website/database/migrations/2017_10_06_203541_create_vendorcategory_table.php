<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorcategoryTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendors_categories', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');   
            $table->string('thumbnail')->nullable();
            $table->string('image')->nullable();    
            $table->string('slug')->nullable(); 
            $table->timestamps();
        });

        DB::table('vendors_categories')->insert([
            ['name' => "Attire & Accessories", 'slug' => 'attire'],
            ['name' => "Beauty & Health", 'slug' => 'beauty'],
            ['name' => "Cake & Dessert", 'slug' => 'cake'],
            ['name' => "Caterers", 'slug' => 'caterers'],
            ['name' => "Event Planners", 'slug' => 'event-planners'],
            ['name' => "Favors & Gifts", 'slug' => 'favors'],
            ['name' => "Florists & Designers", 'slug' => 'florists'],
            ['name' => "Jewelry", 'slug' => 'jewelry'],
            ['name' => "Musicians & Entertainment", 'slug' => 'musicians'],
            ['name' => "Officiants", 'slug' => 'officiants'],
            ['name' => "Photographers", 'slug' => 'photographers'],
            ['name' => "Rentals", 'slug' => 'rentals'],
            ['name' => "Registries", 'slug' => 'registries'],
            ['name' => "Shoes", 'slug' => 'shoes'],
            ['name' => "Stationery", 'slug' => 'stationery'],
            ['name' => "Wedding Shows & Events", 'slug' => 'wedding-shows'],
            ['name' => "Travel & Transportation", 'slug' => 'travel'],
            ['name' => "Unique Services", 'slug' => 'services'],
            ['name' => "Venues", 'slug' => 'venues'],
            ['name' => "Videographers", 'slug' => 'videographers']            
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('vendors_categories');
    }
}
