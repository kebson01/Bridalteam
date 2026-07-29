<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CommunityReply extends Model
{
    protected $table = 'community_replies';

    protected $fillable = [
        'thread_id', 'body', 'author_id', 'author_name', 'author_type', 'hidden',
    ];
}
