<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateWeddingMembersTable extends Migration
{
    public function up()
    {
        Schema::create('wedding_members', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('wedding_id');
            $table->unsignedInteger('user_id')->nullable(); // set once invite accepted
            $table->string('name');
            $table->string('email')->nullable();
            // owner, co_planner, maid_of_honor, best_man, bridesmaid, groomsman, family, other
            $table->string('role')->default('other');
            $table->string('invite_token')->nullable();
            $table->string('invite_status')->default('pending'); // pending, accepted, declined
            $table->boolean('can_edit')->default(false);
            $table->timestamps();

            $table->index('wedding_id');
            $table->index('user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('wedding_members');
    }
}
