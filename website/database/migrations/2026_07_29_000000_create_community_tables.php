<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateCommunityTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('community_threads', function (Blueprint $table) {
            $table->increments('id');
            $table->string('topic')->default('general')->index();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('body');
            // Author is any App\User; author_type distinguishes a plain
            // member (couple/guest) from a user who also owns a vendor.
            $table->integer('author_id')->unsigned()->index();
            $table->string('author_name');
            $table->string('author_type')->default('member'); // member | vendor
            $table->integer('reply_count')->unsigned()->default(0);
            $table->timestamps();
        });

        Schema::create('community_replies', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('thread_id')->unsigned()->index();
            $table->text('body');
            $table->integer('author_id')->unsigned()->index();
            $table->string('author_name');
            $table->string('author_type')->default('member');
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
        Schema::dropIfExists('community_replies');
        Schema::dropIfExists('community_threads');
    }
}
