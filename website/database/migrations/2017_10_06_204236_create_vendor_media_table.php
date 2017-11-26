<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorMediaTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendor_media', function (Blueprint $table) {
            $table->increments('id');
            $table->string('path');
            $table->string('thumbnailpath');
            $table->string('square_thumbnailpath');       
            $table->string('urlpath');
            $table->string('type');
            $table->integer('status');
            $table->text('category')->nullable();
            $table->string('subcategories')->nullable();  
            $table->string('keyword')->nullable();
            $table->integer('color')->nullable();
            $table->integer('theme')->nullable();
            $table->boolean('isproduct');  
            $table->integer('order');  
            $table->string('product_link')->nullable();
            $table->string('video_link')->nullable(); 
            $table->integer('vendor_id')->unsigned()->nullable();
            $table->foreign('vendor_id')->references('id')->on('vendors');
            $table->softDeletes();
            $table->dateTime('published_on')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('vendor_media');
    }
}
