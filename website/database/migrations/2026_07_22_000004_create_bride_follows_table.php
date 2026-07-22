<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateBrideFollowsTable extends Migration
{
    /**
     * A follow relationship: bride_id follows following_bride_id.  Powers the
     * social feed and follower/following counts.
     */
    public function up()
    {
        Schema::create('bride_follows', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('bride_id')->unsigned();
            $table->integer('following_bride_id')->unsigned();
            $table->timestamps();

            $table->unique(['bride_id', 'following_bride_id']);
            $table->index('following_bride_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('bride_follows');
    }
}
