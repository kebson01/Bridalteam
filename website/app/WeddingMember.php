<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class WeddingMember extends Model
{
    protected $table = 'wedding_members';

    protected $fillable = [
        'wedding_id', 'user_id', 'name', 'email', 'role',
        'invite_token', 'invite_status', 'can_edit',
    ];

    protected $casts = [
        'can_edit' => 'boolean',
    ];

    public function wedding()
    {
        return $this->belongsTo(Wedding::class, 'wedding_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
