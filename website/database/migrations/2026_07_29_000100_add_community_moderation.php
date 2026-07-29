<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddCommunityModeration extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('community_threads', function (Blueprint $table) {
            $table->boolean('hidden')->default(false)->index();
        });

        Schema::table('community_replies', function (Blueprint $table) {
            $table->boolean('hidden')->default(false)->index();
        });

        // Admin flag so community moderation endpoints can be gated. No such
        // flag existed on users before; defaults to false for everyone.
        if (! Schema::hasColumn('users', 'is_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_admin')->default(false);
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('community_threads', function (Blueprint $table) {
            $table->dropColumn('hidden');
        });

        Schema::table('community_replies', function (Blueprint $table) {
            $table->dropColumn('hidden');
        });

        if (Schema::hasColumn('users', 'is_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_admin');
            });
        }
    }
}
