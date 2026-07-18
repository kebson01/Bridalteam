<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesWedding;
use App\Wedding;
use App\WeddingMember;

class WeddingController extends Controller
{
    use ResolvesWedding;

    /**
     * List the current couple's weddings.
     */
    public function index()
    {
        $user = $this->currentUser();
        $weddings = Wedding::where('owner_user_id', $user->id)->get();

        return response()->json(['status' => 'OK', 'weddings' => $weddings]);
    }

    /**
     * Create a wedding and auto-generate the starter checklist.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'partner1_name'  => 'required|string|max:255',
            'partner2_name'  => 'nullable|string|max:255',
            'wedding_date'   => 'nullable|date',
            'venue_name'     => 'nullable|string|max:255',
            'location_city'  => 'nullable|string|max:255',
            'location_region' => 'nullable|string|max:255',
            'guest_estimate' => 'nullable|integer|min:0',
            'budget_total'   => 'nullable|numeric|min:0',
            'style'          => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = $this->currentUser();

        $wedding = Wedding::create([
            'owner_user_id'    => $user->id,
            'partner1_name'    => $request->partner1_name,
            'partner2_name'    => $request->partner2_name,
            'wedding_date'     => $request->wedding_date,
            'is_date_tentative' => $request->input('is_date_tentative', $request->wedding_date ? false : true),
            'venue_name'       => $request->venue_name,
            'location_city'    => $request->location_city,
            'location_region'  => $request->location_region,
            'guest_estimate'   => $request->guest_estimate,
            'budget_total'     => $request->budget_total,
            'style'            => $request->style,
            'status'           => 'planning',
        ]);

        // Owner is automatically a member.
        WeddingMember::create([
            'wedding_id'    => $wedding->id,
            'user_id'       => $user->id,
            'name'          => $wedding->partner1_name,
            'email'         => $user->email,
            'role'          => 'owner',
            'invite_status' => 'accepted',
            'can_edit'      => true,
        ]);

        $generated = $wedding->generateTasksFromTemplates();

        return response()->json([
            'status'          => 'OK',
            'wedding'         => $wedding,
            'tasks_generated' => $generated,
            'progress'        => $wedding->progress(),
        ], 201);
    }

    /**
     * Dashboard: wedding + progress + members.
     */
    public function show($id)
    {
        $wedding = $this->findOwnedWedding($id);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        return response()->json([
            'status'   => 'OK',
            'wedding'  => $wedding,
            'progress' => $wedding->progress(),
            'members'  => $wedding->members()->get(),
        ]);
    }

    /**
     * Update wedding details. If the date changes, refresh generated task
     * due dates and top up any newly-applicable template tasks.
     */
    public function update(Request $request, $id)
    {
        $wedding = $this->findOwnedWedding($id);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'wedding_date'   => 'nullable|date',
            'guest_estimate' => 'nullable|integer|min:0',
            'budget_total'   => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $dateChanged = $request->has('wedding_date')
            && $request->wedding_date != $wedding->wedding_date;

        $wedding->fill($request->only([
            'partner1_name', 'partner2_name', 'wedding_date', 'is_date_tentative',
            'venue_name', 'location_city', 'location_region', 'guest_estimate',
            'budget_total', 'style', 'status',
        ]));
        $wedding->save();

        if ($dateChanged && $wedding->wedding_date) {
            $this->recomputeTaskDueDates($wedding);
        }

        // Top up any template tasks that now apply (e.g. guest count crossed a threshold).
        $wedding->generateTasksFromTemplates();

        return response()->json([
            'status'   => 'OK',
            'wedding'  => $wedding,
            'progress' => $wedding->progress(),
        ]);
    }

    /**
     * Recompute due dates for template-derived tasks off the new wedding date.
     */
    protected function recomputeTaskDueDates(Wedding $wedding)
    {
        $tasks = $wedding->tasks()->whereNotNull('timeline_offset_days')->get();
        foreach ($tasks as $task) {
            $task->due_date = \Carbon\Carbon::parse($wedding->wedding_date)
                ->subDays($task->timeline_offset_days)
                ->toDateString();
            $task->save();
        }
    }
}
