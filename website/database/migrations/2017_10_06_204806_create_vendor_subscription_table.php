<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorSubscriptionTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendor_subscriptions', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('vendor_id');
            $table->integer('subscription_id');
            $table->integer('renewaltries')->default(0);
            $table->date('nextrenewal_on')->nullable();   
            $table->date('periodstarted_on');            
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
        Schema::dropIfExists('vendor_subscriptions');
    }
}
