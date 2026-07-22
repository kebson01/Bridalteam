<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateBoardItemsTable extends Migration
{
    /**
     * A board item is a single piece of inspiration (gallery media) saved
     * into a board, optionally with a personal note.
     */
    public function up()
    {
        Schema::create('board_items', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('board_id')->unsigned();
            $table->integer('media_id')->unsigned();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['board_id', 'media_id']);
            $table->index('media_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('board_items');
    }
}
