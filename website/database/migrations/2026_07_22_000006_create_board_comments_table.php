<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateBoardCommentsTable extends Migration
{
    /**
     * A comment left by a bride on an inspiration board.
     */
    public function up()
    {
        Schema::create('board_comments', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('board_id')->unsigned();
            $table->integer('bride_id')->unsigned();
            $table->text('body');
            $table->softDeletes();
            $table->timestamps();

            $table->index('board_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('board_comments');
    }
}
