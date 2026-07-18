<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTasksTable extends Migration
{
    public function up()
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('wedding_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->default('general');
            $table->string('status')->default('todo'); // todo, in_progress, done, skipped
            $table->string('priority')->default('normal'); // low, normal, high
            $table->date('due_date')->nullable();
            $table->integer('timeline_offset_days')->nullable();
            $table->unsignedInteger('assigned_member_id')->nullable();
            $table->unsignedInteger('template_id')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('wedding_id');
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('tasks');
    }
}
