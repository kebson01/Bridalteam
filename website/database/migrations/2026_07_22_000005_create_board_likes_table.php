<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateBoardLikesTable extends Migration
{
    /**
     * A "like" on an inspiration board.
     */
    public function up()
    {
        Schema::create('board_likes', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('bride_id')->unsigned();
            $table->integer('board_id')->unsigned();
            $table->timestamps();

            $table->unique(['bride_id', 'board_id']);
            $table->index('board_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('board_likes');
    }
}
