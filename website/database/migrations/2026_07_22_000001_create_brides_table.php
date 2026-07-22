<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateBridesTable extends Migration
{
    /**
     * A bride is a social/consumer account.  It mirrors the existing
     * User + Vendor pattern: a bride record is linked to a User row which
     * provides authentication (JWT), while the bride record holds the
     * public social profile.
     */
    public function up()
    {
        Schema::create('brides', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('user_id')->unsigned();
            $table->string('firstname');
            $table->string('lastname');
            $table->string('displayname');
            $table->string('slug')->unique();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->date('wedding_date')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('brides');
    }
}
