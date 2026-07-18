<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesWedding;
use App\Task;
use App\Deliverable;

/**
 * Notes, links, and (later) files attached to a task — contracts, mood
 * boards, playlists, menus, etc.
 */
class DeliverableController extends Controller
{
    use ResolvesWedding;

    public function index($weddingId, $taskId)
    {
        $task = $this->resolveTask($weddingId, $taskId);
        if (! $task) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        return response()->json([
            'status'       => 'OK',
            'deliverables' => $task->deliverables()->get(),
        ]);
    }

    public function store(Request $request, $weddingId, $taskId)
    {
        $task = $this->resolveTask($weddingId, $taskId);
        if (! $task) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'type'  => 'nullable|in:note,link,file',
            'url'   => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $deliverable = Deliverable::create([
            'task_id'             => $task->id,
            'wedding_id'          => $task->wedding_id,
            'type'                => $request->input('type', 'note'),
            'title'               => $request->title,
            'body'                => $request->body,
            'url'                 => $request->url,
            'uploaded_by_user_id' => $this->currentUser()->id,
        ]);

        return response()->json(['status' => 'OK', 'deliverable' => $deliverable], 201);
    }

    public function destroy($weddingId, $taskId, $deliverableId)
    {
        $task = $this->resolveTask($weddingId, $taskId);
        if (! $task) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $deliverable = Deliverable::where('id', $deliverableId)
            ->where('task_id', $task->id)
            ->first();

        if (! $deliverable) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $deliverable->delete();

        return response()->json(['status' => 'OK']);
    }

    /**
     * Load a task only if it belongs to a wedding the current user owns.
     */
    protected function resolveTask($weddingId, $taskId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return null;
        }

        return Task::where('id', $taskId)->where('wedding_id', $wedding->id)->first();
    }
}
