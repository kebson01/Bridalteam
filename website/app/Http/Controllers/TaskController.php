<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesWedding;
use App\Task;
use Carbon\Carbon;

class TaskController extends Controller
{
    use ResolvesWedding;

    /**
     * List tasks for a wedding, optionally filtered by status/category.
     */
    public function index(Request $request, $weddingId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $query = $wedding->tasks()->orderBy('sort_order')->orderBy('due_date');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json([
            'status'   => 'OK',
            'tasks'    => $query->get(),
            'progress' => $wedding->progress(),
        ]);
    }

    /**
     * Add a custom task the couple thought of themselves.
     */
    public function store(Request $request, $weddingId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title'    => 'required|string|max:255',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|in:low,normal,high',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $task = Task::create([
            'wedding_id'         => $wedding->id,
            'title'              => $request->title,
            'description'        => $request->description,
            'category'           => $request->input('category', 'general'),
            'status'             => 'todo',
            'priority'           => $request->input('priority', 'normal'),
            'due_date'           => $request->due_date,
            'assigned_member_id' => $request->assigned_member_id,
        ]);

        return response()->json(['status' => 'OK', 'task' => $task], 201);
    }

    /**
     * Update a task — most commonly to check it off.
     */
    public function update(Request $request, $weddingId, $taskId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $task = Task::where('id', $taskId)->where('wedding_id', $wedding->id)->first();
        if (! $task) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status'   => 'nullable|in:todo,in_progress,done,skipped',
            'priority' => 'nullable|in:low,normal,high',
            'due_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $task->fill($request->only([
            'title', 'description', 'category', 'status', 'priority',
            'due_date', 'assigned_member_id',
        ]));

        // Stamp completion time when a task is marked done.
        if ($request->has('status')) {
            $task->completed_at = $request->status === 'done' ? Carbon::now() : null;
        }

        $task->save();

        return response()->json([
            'status'   => 'OK',
            'task'     => $task,
            'progress' => $wedding->progress(),
        ]);
    }

    public function destroy($weddingId, $taskId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $task = Task::where('id', $taskId)->where('wedding_id', $wedding->id)->first();
        if (! $task) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $task->deliverables()->delete();
        $task->delete();

        return response()->json(['status' => 'OK']);
    }
}
