<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $table = 'tasks';

    protected $fillable = [
        'wedding_id', 'title', 'description', 'category', 'status', 'priority',
        'due_date', 'timeline_offset_days', 'assigned_member_id', 'template_id',
        'sort_order', 'completed_at',
    ];

    public function wedding()
    {
        return $this->belongsTo(Wedding::class, 'wedding_id');
    }

    public function deliverables()
    {
        return $this->hasMany(Deliverable::class, 'task_id');
    }

    public function assignee()
    {
        return $this->belongsTo(WeddingMember::class, 'assigned_member_id');
    }
}
