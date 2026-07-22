<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InspirationBoard extends Model
{
    use SoftDeletes;

    protected $table = 'inspiration_boards';
    protected $dates = ['deleted_at'];

    public function getOwner(){
        return Bride::find($this->bride_id);
    }

    public function getItems(){
        $items = BoardItem::where('board_id', '=', $this->id)
            ->orderBy('created_at', 'desc')->get();
        foreach($items as $item){
            $item->media = Media::find($item->media_id);
        }
        return $items;
    }

    public function itemCount(){
        return BoardItem::where('board_id', '=', $this->id)->count();
    }

    public function likeCount(){
        return BoardLike::where('board_id', '=', $this->id)->count();
    }

    public function commentCount(){
        return BoardComment::where('board_id', '=', $this->id)->count();
    }

    public function isLikedBy($brideId){
        if(!$brideId){
            return false;
        }
        return BoardLike::where('board_id', '=', $this->id)
            ->where('bride_id', '=', $brideId)->exists();
    }

    /**
     * The cover media (explicit cover, else the most recently added item).
     */
    public function coverMedia(){
        $media = null;
        if($this->cover_media_id){
            $media = Media::find($this->cover_media_id);
        }
        if($media == null){
            $item = BoardItem::where('board_id', '=', $this->id)
                ->orderBy('created_at', 'desc')->first();
            if($item){
                $media = Media::find($item->media_id);
            }
        }
        return $media;
    }

    /**
     * Summary representation used in feeds and profile listings.
     */
    public function toSummary($viewerBrideId = null){
        $owner = $this->getOwner();
        $coverMedia = $this->coverMedia();
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'slug' => $this->slug,
            'is_public' => (bool) $this->is_public,
            'cover' => $coverMedia ? $coverMedia->thumbnailpath : null,
            'cover_type' => $coverMedia ? $coverMedia->type : null,
            'items' => $this->itemCount(),
            'likes' => $this->likeCount(),
            'comments' => $this->commentCount(),
            'isliked' => $this->isLikedBy($viewerBrideId),
            'updated_at' => $this->updated_at ? $this->updated_at->toDateTimeString() : null,
            'owner' => $owner ? [
                'id' => $owner->id,
                'displayname' => $owner->displayname,
                'slug' => $owner->slug,
                'avatar' => $owner->avatar,
            ] : null,
        ];
    }
}
