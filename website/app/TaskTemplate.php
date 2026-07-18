<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class TaskTemplate extends Model
{
    protected $table = 'task_templates';

    protected $fillable = [
        'title', 'description', 'category', 'timeline_bucket',
        'timeline_offset_days', 'default_priority', 'applies_if', 'sort_order',
    ];
}
