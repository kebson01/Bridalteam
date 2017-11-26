<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->increments('id');
            $table->string('pcfirstname');
            $table->string('pclastname');
            $table->string('pcphone');            
            $table->string('pcphoneext')->nullable();            
            $table->string('pcemail');
            $table->string('ownerfirstname');
            $table->string('ownerlastname');
            $table->string('ownerphone');
            $table->string('ownerphoneext')->nullable();
            $table->string('owneremail');
            $table->string('address');
            $table->string('address2')->nullable();
            $table->string('city');
            $table->string('state');
            $table->string('zip');
            $table->string('country');
            
            $table->string('businessname');
            $table->integer('category')->unsigned();
            $table->foreign('category')->references('id')->on('vendors_categories');
            $table->integer('secondarycategory')->nullable();
            
            $table->boolean('isnational');
            $table->string('facebook')->nullable();
            $table->string('twitter')->nullable();            
            
            $table->string('url');
            $table->text('about')->nullable();
            $table->text('services')->nullable();
            $table->json('faq')->nullable();
            $table->json('categoryquestions')->nullable();
            $table->string('motto')->nullable();
            $table->string('logo')->nullable();
            $table->string('backgroundimage')->nullable();

            $table->integer('user_id')->unsigned()->nullable();
            $table->foreign('user_id')->references('id')->on('users');
            
            $table->boolean('active');
            
            $table->date('expiration_date')->nullable();
            $table->string('slug');

            $table->decimal('minbudget', 10, 2)->nullable();
            $table->decimal('maxbudget', 10, 2)->nullable();
            $table->boolean('showcitystate');  
            $table->boolean('isfirstlogin');  
            $table->string('source');  
            $table->string('type');
            $table->integer('region')->nullable();
            $table->boolean('approved');            
            $table->dateTime('approved_on')->nullable();
            $table->softDeletes();
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
        Schema::dropIfExists('vendors');
    }
}
