<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\User;
use App\CommunityThread;
use App\CommunityReply;

use Hash;
use JWTAuth;
use Carbon\Carbon;

/**
 * Community: public read, auth-gated write.
 *
 * Read routes (index/topic/thread) are wrapped in the `optionaluser`
 * middleware so anyone can browse without an account while a logged-in
 * visitor still gets personalised UI. Write routes (compose/store/reply)
 * are wrapped in `requireuser`, which lets any App\User post — a plain
 * member (couple/guest) or a user who also owns a vendor.
 *
 * Extends PageController to reuse its menu + shared `$user` bootstrapping.
 */
class CommunityController extends PageController
{
    /** Topics shown in the community nav / composer. */
    public static $topics = [
        'general'     => 'General',
        'planning'    => 'Wedding Planning',
        'inspiration' => 'Inspiration & Ideas',
        'vendors'     => 'Vendor Recommendations',
        'budget'      => 'Budget & Advice',
    ];

    /**
     * Rate limits: max posts a single user may create within the window.
     * Keeps a compromised or spammy account from flooding the community.
     */
    const RATE_WINDOW_MINUTES = 10;
    const MAX_THREADS_PER_WINDOW = 3;
    const MAX_REPLIES_PER_WINDOW = 10;

    /* -------------------------------------------------------------------
     |  Public reads (optionaluser middleware)
     | ------------------------------------------------------------------ */

    public function showIndex()
    {
        $threads = CommunityThread::where('hidden', '=', false)
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get();

        return view('community.index', [
            'threads' => $threads,
            'topics'  => self::$topics,
            'topic'   => null,
            'isAdmin' => $this->isAdmin(),
        ]);
    }

    public function showTopic($topic)
    {
        if (! array_key_exists($topic, self::$topics)) {
            abort(404);
        }

        $threads = CommunityThread::where('topic', '=', $topic)
            ->where('hidden', '=', false)
            ->orderBy('updated_at', 'desc')
            ->take(50)
            ->get();

        return view('community.index', [
            'threads' => $threads,
            'topics'  => self::$topics,
            'topic'   => $topic,
            'isAdmin' => $this->isAdmin(),
        ]);
    }

    public function showThread($slug)
    {
        $thread = CommunityThread::where('slug', '=', $slug)->first();
        if (! $thread) {
            abort(404);
        }

        $isAdmin = $this->isAdmin();

        // A hidden thread is only viewable by an admin (for moderation).
        if ($thread->hidden && ! $isAdmin) {
            abort(404);
        }

        // Admins see hidden replies too (marked, so they can unhide);
        // everyone else sees only visible replies.
        if ($isAdmin) {
            $replies = CommunityReply::where('thread_id', '=', $thread->id)
                ->orderBy('created_at', 'asc')->get();
        } else {
            $replies = $thread->getReplies();
        }

        return view('community.thread', [
            'thread'  => $thread,
            'replies' => $replies,
            'topics'  => self::$topics,
            'isAdmin' => $isAdmin,
        ]);
    }

    /* -------------------------------------------------------------------
     |  Auth-gated page (requireuser middleware)
     | ------------------------------------------------------------------ */

    public function showCompose()
    {
        return view('community.compose', [
            'topics' => self::$topics,
        ]);
    }

    /* -------------------------------------------------------------------
     |  Auth-gated writes — JSON API (requireuser middleware)
     | ------------------------------------------------------------------ */

    public function storeThread(Request $request)
    {
        $user = $this->currentUser();
        if (! $user) {
            return response()->json(['error' => 'auth_required'], 401);
        }

        if ($this->tooManyRecent(CommunityThread::class, $user->id, self::MAX_THREADS_PER_WINDOW)) {
            return response()->json(['error' => 'You are posting too fast. Please wait a few minutes and try again.'], 429);
        }

        $title = trim($request->input('title', ''));
        $body  = trim($request->input('body', ''));
        $topic = $request->input('topic', 'general');

        if ($title === '' || $body === '') {
            return response()->json(['error' => 'Title and body are required.'], 422);
        }
        if (! array_key_exists($topic, self::$topics)) {
            $topic = 'general';
        }

        $thread = new CommunityThread;
        $thread->topic       = $topic;
        $thread->title       = $title;
        $thread->slug        = CommunityThread::makeSlug($title);
        $thread->body        = $body;
        $thread->author_id   = $user->id;
        $thread->author_name = $this->authorName($user);
        $thread->author_type = $this->authorType($user);
        $thread->reply_count = 0;
        $thread->save();

        return response()->json([
            'status'   => 'ok',
            'redirect' => '/community/thread/' . $thread->slug,
        ]);
    }

    public function storeReply(Request $request, $id)
    {
        $user = $this->currentUser();
        if (! $user) {
            return response()->json(['error' => 'auth_required'], 401);
        }

        if ($this->tooManyRecent(CommunityReply::class, $user->id, self::MAX_REPLIES_PER_WINDOW)) {
            return response()->json(['error' => 'You are posting too fast. Please wait a few minutes and try again.'], 429);
        }

        $thread = CommunityThread::find($id);
        if (! $thread || $thread->hidden) {
            return response()->json(['error' => 'Thread not found.'], 404);
        }

        $body = trim($request->input('body', ''));
        if ($body === '') {
            return response()->json(['error' => 'Reply cannot be empty.'], 422);
        }

        $reply = new CommunityReply;
        $reply->thread_id   = $thread->id;
        $reply->body        = $body;
        $reply->author_id   = $user->id;
        $reply->author_name = $this->authorName($user);
        $reply->author_type = $this->authorType($user);
        $reply->save();

        $thread->reply_count = CommunityReply::where('thread_id', '=', $thread->id)
            ->where('hidden', '=', false)->count();
        $thread->touch();
        $thread->save();

        return response()->json([
            'status'   => 'ok',
            'redirect' => '/community/thread/' . $thread->slug,
        ]);
    }

    public function deleteReply(Request $request, $id)
    {
        $user = $this->currentUser();
        if (! $user) {
            return response()->json(['error' => 'auth_required'], 401);
        }

        $reply = CommunityReply::find($id);
        if (! $reply) {
            return response()->json(['error' => 'Reply not found.'], 404);
        }
        if ($reply->author_id != $user->id) {
            return response()->json(['error' => 'Not allowed.'], 403);
        }

        $threadId = $reply->thread_id;
        $reply->delete();

        $thread = CommunityThread::find($threadId);
        if ($thread) {
            $thread->reply_count = CommunityReply::where('thread_id', '=', $thread->id)
                ->where('hidden', '=', false)->count();
            $thread->save();
        }

        return response()->json(['status' => 'ok']);
    }

    /* -------------------------------------------------------------------
     |  Moderation — admin only (requireuser + is_admin)
     | ------------------------------------------------------------------ */

    public function moderateThread(Request $request, $id)
    {
        if (! $this->isAdmin()) {
            return response()->json(['error' => 'Not allowed.'], 403);
        }
        $thread = CommunityThread::find($id);
        if (! $thread) {
            return response()->json(['error' => 'Thread not found.'], 404);
        }
        $thread->hidden = (bool) $request->input('hidden', true);
        $thread->save();

        return response()->json(['status' => 'ok', 'hidden' => $thread->hidden]);
    }

    public function moderateReply(Request $request, $id)
    {
        if (! $this->isAdmin()) {
            return response()->json(['error' => 'Not allowed.'], 403);
        }
        $reply = CommunityReply::find($id);
        if (! $reply) {
            return response()->json(['error' => 'Reply not found.'], 404);
        }
        $reply->hidden = (bool) $request->input('hidden', true);
        $reply->save();

        // Keep the parent thread's reply_count in sync with visible replies.
        $thread = CommunityThread::find($reply->thread_id);
        if ($thread) {
            $thread->reply_count = CommunityReply::where('thread_id', '=', $thread->id)
                ->where('hidden', '=', false)->count();
            $thread->save();
        }

        return response()->json(['status' => 'ok', 'hidden' => $reply->hidden]);
    }

    /* -------------------------------------------------------------------
     |  Member auth — register/login for non-vendor users
     | ------------------------------------------------------------------ */

    public function showRegister()
    {
        return view('community.register', ['topics' => self::$topics]);
    }

    public function showLogin()
    {
        return view('community.login', ['topics' => self::$topics]);
    }

    /**
     * Register a plain community member (a User with no vendor record).
     */
    public function registerMember(Request $request)
    {
        $firstname = trim($request->input('firstname', ''));
        $lastname  = trim($request->input('lastname', ''));
        $email     = trim($request->input('email', ''));
        $password  = $request->input('password', '');

        if ($firstname === '' || $email === '' || $password === '') {
            return response()->json(['error' => 'First name, email and password are required.'], 422);
        }

        if (User::where('email', '=', $email)->first() != null) {
            return response()->json(['error' => 'An account already exists for this email address.'], 409);
        }

        $user = new User;
        $user->email             = $email;
        $user->name              = $email;
        $user->firstname         = $firstname;
        $user->lastname          = $lastname;
        $user->verification_code = md5(uniqid($email, true));
        $user->password          = Hash::make($password);
        $user->save();

        // Issue the same token/cookie the vendor flow uses so the member is
        // immediately logged in and can post.
        $token = JWTAuth::fromUser($user);

        return response()->json([
            'status' => 'ok',
            'token'  => $token,
        ]);
    }

    /* -------------------------------------------------------------------
     |  Helpers
     | ------------------------------------------------------------------ */

    /**
     * Resolve the current user from the token cookie. The requireuser
     * middleware has already validated it for gated routes; this reads it
     * back so writes don't depend on an Authorization header.
     */
    private function currentUser()
    {
        $token = isset($_COOKIE['btvendortoken']) ? $_COOKIE['btvendortoken'] : '';
        if ($token === '') {
            return null;
        }
        try {
            return JWTAuth::setToken($token)->authenticate();
        } catch (\Exception $e) {
            return null;
        }
    }

    private function authorName($user)
    {
        $name = trim($user->firstname . ' ' . $user->lastname);
        return $name !== '' ? $name : $user->email;
    }

    private function authorType($user)
    {
        try {
            return $user->findVendor() ? 'vendor' : 'member';
        } catch (\Exception $e) {
            return 'member';
        }
    }

    /**
     * True if the current user is flagged as an admin (moderator).
     */
    private function isAdmin()
    {
        $user = $this->currentUser();
        return $user && ! empty($user->is_admin);
    }

    /**
     * Rate-limit guard: has this user created >= $max rows of $modelClass
     * within the sliding window? Uses created_at counts (no cache needed).
     */
    private function tooManyRecent($modelClass, $authorId, $max)
    {
        $since = Carbon::now()->subMinutes(self::RATE_WINDOW_MINUTES);
        $count = $modelClass::where('author_id', '=', $authorId)
            ->where('created_at', '>=', $since)
            ->count();

        return $count >= $max;
    }
}
