<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateWedfolioColorsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('wedfolio_colors', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('color');
        });

        DB::table('wedfolio_colors')->insert([
            ['name' => "Red", 'color' => "#ff0000"],
            ['name' => "Salmon", 'color' => "#FA8072"],
            ['name' => "Coral", 'color' => "#FF7F50"],
            ['name' => "Orange", 'color' => "#FFA500"],
            ['name' => "Gold", 'color' => "#FFD700"],
            ['name' => "Yellow", 'color' => "#FFFF00"],
            ['name' => "Fuchsia", 'color' => "#FF00FF"],
            ['name' => "Pink", 'color' => "#FFC0CB"],
            ['name' => "Blush", 'color' => "#FFE4E1"],
            ['name' => "Maroon", 'color' => "#800000"],
            ['name' => "Brown", 'color' => "#A0522D"],
            ['name' => "Chocolate", 'color' => "#D2691E"],
            ['name' => "Tan", 'color' => "#D2B48C"],
            ['name' => "Cream", 'color' => "#F5DEB3"],
            ['name' => "Sky Blue", 'color' => "#87CEEB"],
            ['name' => "Turquoise", 'color' => "#40E0D0"],
            ['name' => "Aqua", 'color' => "#00FFFF"],
            ['name' => "Light Green", 'color' => "#90EE90"],
            ['name' => "Teal", 'color' => "#008080"],
            ['name' => "Olive", 'color' => "#808000"],
            ['name' => "Green", 'color' => "#008000"],
            ['name' => "Blue", 'color' => "#0000FF"],
            ['name' => "Navy", 'color' => "#000080"],
            ['name' => "Purple", 'color' => "#800080"],
            ['name' => "Lavender", 'color' => "#E6E6FA"],
            ['name' => "Silver", 'color' => "#C0C0C0"],
            ['name' => "Gray", 'color' => "#808080"],
            ['name' => "White", 'color' => "#ffffff"],
            ['name' => "Black", 'color' => "#000000"],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('wedfolio_colors');
    }
}
