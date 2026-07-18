<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Wedding extends Model
{
    protected $table = 'weddings';

    protected $fillable = [
        'owner_user_id', 'partner1_name', 'partner2_name', 'wedding_date',
        'is_date_tentative', 'venue_name', 'location_city', 'location_region',
        'guest_estimate', 'budget_total', 'style', 'status',
    ];

    protected $casts = [
        'is_date_tentative' => 'boolean',
        'guest_estimate'    => 'integer',
        'budget_total'      => 'float',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function members()
    {
        return $this->hasMany(WeddingMember::class, 'wedding_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'wedding_id');
    }

    /**
     * Generate a starter checklist from the task_templates table.
     * Due dates are derived from the wedding date minus each template's offset.
     * Idempotent-ish: skips templates already generated for this wedding.
     */
    public function generateTasksFromTemplates()
    {
        $existing = $this->tasks()->whereNotNull('template_id')->pluck('template_id')->all();
        $templates = TaskTemplate::orderBy('sort_order')->get();
        $created = 0;

        foreach ($templates as $template) {
            if (in_array($template->id, $existing)) {
                continue;
            }
            if (! $this->templateApplies($template)) {
                continue;
            }

            $dueDate = null;
            if ($this->wedding_date) {
                $dueDate = Carbon::parse($this->wedding_date)
                    ->subDays($template->timeline_offset_days)
                    ->toDateString();
            }

            Task::create([
                'wedding_id'           => $this->id,
                'title'                => $template->title,
                'description'          => $template->description,
                'category'             => $template->category,
                'status'               => 'todo',
                'priority'             => $template->default_priority,
                'due_date'             => $dueDate,
                'timeline_offset_days' => $template->timeline_offset_days,
                'template_id'          => $template->id,
                'sort_order'           => $template->sort_order,
            ]);
            $created++;
        }

        return $created;
    }

    /**
     * Evaluate a template's optional applies_if JSON conditions.
     */
    protected function templateApplies(TaskTemplate $template)
    {
        if (empty($template->applies_if)) {
            return true;
        }

        $conditions = json_decode($template->applies_if, true);
        if (! is_array($conditions)) {
            return true;
        }

        if (isset($conditions['min_guests'])) {
            if (($this->guest_estimate ?? 0) < $conditions['min_guests']) {
                return false;
            }
        }

        return true;
    }

    /**
     * Dashboard summary numbers.
     */
    public function progress()
    {
        $total = $this->tasks()->count();
        $done  = $this->tasks()->where('status', 'done')->count();

        return [
            'total_tasks'     => $total,
            'completed_tasks' => $done,
            'percent_complete' => $total > 0 ? round(($done / $total) * 100) : 0,
            'days_until'      => $this->wedding_date
                ? Carbon::today()->diffInDays(Carbon::parse($this->wedding_date), false)
                : null,
        ];
    }
}
