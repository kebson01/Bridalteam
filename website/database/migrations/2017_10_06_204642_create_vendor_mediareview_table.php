<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVendorMediareviewTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vendor_mediareview', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('media_id');
            $table->integer('vendor_id');
            $table->integer('reviewer_id')->nullable();
            $table->boolean('approved');
            $table->boolean('reviewed');
            $table->dateTime('reviewed_on')->nullable();
            $table->string('reason')->nullable();
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
        Schema::dropIfExists('vendor_mediareview');
    }
}
