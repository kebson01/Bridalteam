<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateWeddingsTable extends Migration
{
    public function up()
    {
        Schema::create('weddings', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('owner_user_id');
            $table->string('partner1_name');
            $table->string('partner2_name')->nullable();
            $table->date('wedding_date')->nullable();
            $table->boolean('is_date_tentative')->default(true);
            $table->string('venue_name')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_region')->nullable();
            $table->unsignedInteger('guest_estimate')->nullable();
            $table->decimal('budget_total', 10, 2)->nullable();
            $table->string('style')->nullable();
            $table->string('status')->default('planning'); // planning, completed, archived
            $table->timestamps();

            $table->index('owner_user_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('weddings');
    }
}
