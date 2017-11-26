<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorChargeLogTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendor_charge_log', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('vendor_id');
            $table->string('charge_id');   
            $table->float('amount');   
            $table->string('stripe_networkstatus');
            $table->string('stripe_failreason')->nullable();
            $table->string('stripe_type');
            $table->string('stripe_risklevel');          
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
        Schema::dropIfExists('vendor_charge_log');
    }
}
