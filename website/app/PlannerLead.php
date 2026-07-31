<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PlannerLead extends Model
{
    protected $table = 'planner_leads';

    protected $fillable = [
        'name',
        'email',
        'message',
        'source',
    ];
}
