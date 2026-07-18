<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Deliverable extends Model
{
    protected $table = 'deliverables';

    protected $fillable = [
        'task_id', 'wedding_id', 'type', 'title', 'body',
        'file_path', 'url', 'uploaded_by_user_id',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class, 'task_id');
    }
}
