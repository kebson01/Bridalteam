<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateWedfolioThemesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('wedfolio_themes', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
        });

        DB::table('wedfolio_themes')->insert([
            ['name' => "Beach"],
            ['name' => "Bohemian"],
            ['name' => "Carnival"],
            ['name' => "Casual"],
            ['name' => "Cherry Blossom"],
            ['name' => "Eclectic"],
            ['name' => "Fairy Tale"],
            ['name' => "Gothic"],
            ['name' => "Hippie"],
            ['name' => "Indian"],
            ['name' => "Mardi gras"],
            ['name' => "Masquerade"],
            ['name' => "Modern"],
            ['name' => "Renaissance"],
            ['name' => "Romantic"],
            ['name' => "Royalty"],
            ['name' => "Rustic"],
            ['name' => "Shabby Chic"],
            ['name' => "Vintage"],
            ['name' => "Whimsical"]            
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('wedfolio_themes');
    }
}
