<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill: media uploaded before video support existed was always stored with
 * type "image", so videos rendered as broken images.  Re-label any media whose
 * file is actually a video (by extension) so the frontend plays it correctly.
 */
class FixExistingVideoMediaTypes extends Migration
{
    public function up()
    {
        $videoExtensions = array('mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'ogv');

        foreach($videoExtensions as $ext){
            DB::table('vendor_media')
                ->where('urlpath', 'LIKE', '%.' . $ext)
                ->update(array('type' => 'video'));
        }
    }

    public function down()
    {
        //No-op: we do not revert corrected media types.
    }
}
