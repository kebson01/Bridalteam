<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTaskTemplatesTable extends Migration
{
    public function up()
    {
        Schema::create('task_templates', function (Blueprint $table) {
            $table->increments('id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category');
            // 12mo_plus, 9mo, 6mo, 3mo, 1mo, week_of, day_of, after
            $table->string('timeline_bucket');
            $table->integer('timeline_offset_days'); // days before wedding this is due
            $table->string('default_priority')->default('normal'); // low, normal, high
            $table->text('applies_if')->nullable(); // JSON conditions, e.g. {"min_guests":100}
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('task_templates');
    }
}
