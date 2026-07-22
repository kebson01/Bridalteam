<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BoardComment extends Model
{
    use SoftDeletes;

    protected $table = 'board_comments';
    protected $dates = ['deleted_at'];

    public function getAuthor(){
        return Bride::find($this->bride_id);
    }

    public function toArrayWithAuthor(){
        $author = $this->getAuthor();
        return [
            'id' => $this->id,
            'body' => $this->body,
            'created_at' => $this->created_at ? $this->created_at->toDateTimeString() : null,
            'author' => $author ? [
                'id' => $author->id,
                'displayname' => $author->displayname,
                'slug' => $author->slug,
                'avatar' => $author->avatar,
            ] : null,
        ];
    }
}
