<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddAccountTypeToUsers extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // 'couple', 'vendor', or 'admin'. Nullable so existing rows are untouched.
            $table->string('account_type')->nullable()->after('email');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('account_type');
        });
    }
}
