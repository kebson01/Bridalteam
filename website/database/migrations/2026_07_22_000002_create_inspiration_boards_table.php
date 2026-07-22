<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateInspirationBoardsTable extends Migration
{
    /**
     * An inspiration board is a shareable collection of inspiration images
     * (referred to as an "event" in the product).  Brides build boards from
     * gallery media and share them; public boards appear in the social feed.
     */
    public function up()
    {
        Schema::create('inspiration_boards', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('bride_id')->unsigned();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('slug')->unique();
            $table->boolean('is_public')->default(true);
            $table->integer('cover_media_id')->unsigned()->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('bride_id');
            $table->index('is_public');
        });
    }

    public function down()
    {
        Schema::dropIfExists('inspiration_boards');
    }
}
