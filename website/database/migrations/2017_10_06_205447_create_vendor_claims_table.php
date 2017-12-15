<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorClaimsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendor_claims', function (Blueprint $table) {
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
            
            $table->string('url');
            $table->integer('vendor_id');
            $table->integer('user_id')->unsigned()->nullable();
            $table->foreign('user_id')->references('id')->on('users');
            
            $table->boolean('active');

            $table->decimal('minbudget', 6, 2)->nullable();
            $table->decimal('maxbudget', 6, 2)->nullable();

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
        Schema::dropIfExists('vendor_claims');
    }
}
