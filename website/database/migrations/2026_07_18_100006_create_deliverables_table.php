<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateDeliverablesTable extends Migration
{
    public function up()
    {
        Schema::create('deliverables', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('task_id');
            $table->unsignedInteger('wedding_id'); // denormalized for easy querying
            $table->string('type')->default('note'); // file, note, link
            $table->string('title');
            $table->text('body')->nullable();       // for notes
            $table->string('file_path')->nullable(); // for files
            $table->string('url')->nullable();       // for links
            $table->unsignedInteger('uploaded_by_user_id')->nullable();
            $table->timestamps();

            $table->index('task_id');
            $table->index('wedding_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('deliverables');
    }
}
