<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ResolvesWedding;
use App\WeddingMember;

/**
 * Co-planners and bridal-party members. An invite creates a pending member
 * with a token; the invitee accepts it while logged in to link their account.
 */
class WeddingMemberController extends Controller
{
    use ResolvesWedding;

    public function index($weddingId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        return response()->json([
            'status'  => 'OK',
            'members' => $wedding->members()->get(),
        ]);
    }

    /**
     * Invite a co-planner or party member.
     */
    public function store(Request $request, $weddingId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'  => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'role'  => 'nullable|in:co_planner,maid_of_honor,best_man,bridesmaid,groomsman,family,other',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $role = $request->input('role', 'other');

        $member = WeddingMember::create([
            'wedding_id'    => $wedding->id,
            'name'          => $request->name,
            'email'         => $request->email,
            'role'          => $role,
            'invite_token'  => Str::random(40),
            'invite_status' => 'pending',
            'can_edit'      => $role === 'co_planner',
        ]);

        // Note: emailing the invite link is wired in Phase 7 (notifications).
        return response()->json([
            'status'       => 'OK',
            'member'       => $member,
            'invite_token' => $member->invite_token,
        ], 201);
    }

    public function update(Request $request, $weddingId, $memberId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $member = WeddingMember::where('id', $memberId)
            ->where('wedding_id', $wedding->id)->first();
        if (! $member) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $member->fill($request->only(['name', 'email', 'role', 'can_edit']));
        $member->save();

        return response()->json(['status' => 'OK', 'member' => $member]);
    }

    public function destroy($weddingId, $memberId)
    {
        $wedding = $this->findOwnedWedding($weddingId);
        if (! $wedding) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        $member = WeddingMember::where('id', $memberId)
            ->where('wedding_id', $wedding->id)->first();
        if (! $member) {
            return response()->json(['status' => 'error', 'error' => 'not_found'], 404);
        }

        if ($member->role === 'owner') {
            return response()->json(['status' => 'error', 'error' => 'cannot_remove_owner'], 422);
        }

        $member->delete();

        return response()->json(['status' => 'OK']);
    }

    /**
     * The current logged-in user accepts an invite via its token.
     */
    public function accept(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'invite_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $member = WeddingMember::where('invite_token', $request->invite_token)
            ->where('invite_status', 'pending')->first();

        if (! $member) {
            return response()->json(['status' => 'error', 'error' => 'invalid_or_used_token'], 404);
        }

        $user = $this->currentUser();
        $member->user_id       = $user->id;
        $member->invite_status = 'accepted';
        $member->save();

        return response()->json([
            'status'     => 'OK',
            'member'     => $member,
            'wedding_id' => $member->wedding_id,
        ]);
    }
}
