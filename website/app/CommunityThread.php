<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use App\CommunityReply;

class CommunityThread extends Model
{
    protected $table = 'community_threads';

    protected $fillable = [
        'topic', 'title', 'slug', 'body',
        'author_id', 'author_name', 'author_type', 'reply_count', 'hidden',
    ];

    /**
     * Replies belonging to this thread, oldest first.
     * Hidden (moderated) replies are excluded from public display.
     */
    public function getReplies()
    {
        return CommunityReply::where('thread_id', '=', $this->id)
            ->where('hidden', '=', false)
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Build a URL-safe, unique slug from a title.
     */
    public static function makeSlug($title)
    {
        $base = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $title), '-'));
        if ($base === '') {
            $base = 'thread';
        }

        $slug = $base;
        $i = 2;
        while (self::where('slug', '=', $slug)->exists()) {
            $slug = $base . '-' . $i;
            $i++;
        }

        return $slug;
    }
}
