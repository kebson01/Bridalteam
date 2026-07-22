<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bride extends Model
{
    use SoftDeletes;

    protected $table = 'brides';
    protected $dates = ['deleted_at', 'wedding_date'];
    protected $hidden = ['user_id'];

    public function getBoards(){
        return InspirationBoard::where('bride_id', '=', $this->id)
            ->orderBy('updated_at', 'desc')->get();
    }

    public function getPublicBoards(){
        return InspirationBoard::where('bride_id', '=', $this->id)
            ->where('is_public', '=', true)
            ->orderBy('updated_at', 'desc')->get();
    }

    public function followerCount(){
        return BrideFollow::where('following_bride_id', '=', $this->id)->count();
    }

    public function followingCount(){
        return BrideFollow::where('bride_id', '=', $this->id)->count();
    }

    public function boardCount(){
        return InspirationBoard::where('bride_id', '=', $this->id)->count();
    }

    /**
     * Ids of the brides this bride follows.
     */
    public function followingIds(){
        return BrideFollow::where('bride_id', '=', $this->id)
            ->pluck('following_bride_id')->toArray();
    }

    /**
     * Is this bride followed by the given bride id?
     */
    public function isFollowedBy($brideId){
        if(!$brideId){
            return false;
        }
        return BrideFollow::where('bride_id', '=', $brideId)
            ->where('following_bride_id', '=', $this->id)->exists();
    }

    /**
     * Public-facing representation used across the social endpoints.
     */
    public function toProfile($viewerBrideId = null){
        return [
            'id' => $this->id,
            'displayname' => $this->displayname,
            'firstname' => $this->firstname,
            'slug' => $this->slug,
            'avatar' => $this->avatar,
            'bio' => $this->bio,
            'wedding_date' => $this->wedding_date ? $this->wedding_date->format('Y-m-d') : null,
            'followers' => $this->followerCount(),
            'following' => $this->followingCount(),
            'boards' => $this->boardCount(),
            'isfollowing' => $this->isFollowedBy($viewerBrideId),
            'isself' => $viewerBrideId != null && $viewerBrideId == $this->id,
        ];
    }
}
