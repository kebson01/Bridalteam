<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests;
use App\Http\Controllers\Controller;

use App\User;
use App\Bride;
use App\Media;
use App\InspirationBoard;
use App\BoardItem;
use App\BoardLike;
use App\BoardComment;
use App\BrideFollow;

use Carbon\Carbon;
use Hash;
use Validator;
use JWTAuth;
use Image;

/**
 * Social "inspiration" features for brides: accounts, shareable inspiration
 * boards, following, likes, comments and an activity feed.
 */
class BrideController extends Controller
{
    /**
     * Resolve the currently authenticated bride from the JWT if one is
     * present.  Returns null for anonymous/vendor visitors instead of
     * throwing, so the same endpoints can serve public and logged-in views.
     */
    private function currentBride(){
        try {
            $token = JWTAuth::getToken();
            if(!$token){
                return null;
            }
            $user = JWTAuth::parseToken()->authenticate();
            if(!$user){
                return null;
            }
            return $user->findBride();
        } catch (\Exception $e) {
            return null;
        }
    }

    private function uniqueSlug($base, $modelClass){
        $slug = str_slug($base);
        if($slug == ""){
            $slug = "bride";
        }
        $original = $slug;
        $i = 1;
        while($modelClass::withTrashed()->where('slug', '=', $slug)->exists()){
            $slug = $original . "-" . $i;
            $i++;
        }
        return $slug;
    }

    // ---------------------------------------------------------------------
    // Accounts
    // ---------------------------------------------------------------------

    public function registerBride(Request $request){
        $validator = Validator::make($request->all(), [
            'firstname' => 'required',
            'lastname' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        if($validator->fails()){
            return response()->json([
                'status' => 'Error',
                'message' => $validator->errors()->first()
            ]);
        }

        if(User::where('email', '=', $request->email)->first() != null){
            return response()->json([
                'status' => 'Error',
                'message' => 'An account already exists for this email address.'
            ]);
        }

        $user = new User;
        $user->email = $request->email;
        $user->name = $request->email;
        $user->firstname = $request->firstname;
        $user->lastname = $request->lastname;
        $user->password = Hash::make($request->password);
        $user->save();

        $displayname = $request->displayname ? $request->displayname : ($request->firstname . " " . $request->lastname);

        $bride = new Bride;
        $bride->user_id = $user->id;
        $bride->firstname = $request->firstname;
        $bride->lastname = $request->lastname;
        $bride->displayname = $displayname;
        $bride->slug = $this->uniqueSlug($displayname, Bride::class);
        $bride->save();

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'status' => 'OK',
            'token' => $token,
            'bride' => $bride->toProfile($bride->id)
        ]);
    }

    public function login(Request $request){
        $credentials = $request->only('email', 'password');

        try {
            if(!$token = JWTAuth::attempt($credentials)){
                return response()->json([
                    'status' => 'Error',
                    'message' => 'Invalid email or password.'
                ], 401);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Could not log you in. Please try again.'
            ], 500);
        }

        $user = JWTAuth::setToken($token)->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json([
                'status' => 'Error',
                'message' => 'This account is not a bride account.'
            ], 401);
        }

        return response()->json([
            'status' => 'OK',
            'token' => $token,
            'bride' => $bride->toProfile($bride->id)
        ]);
    }

    public function getBrideDetails(){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Bride account not found.'], 404);
        }

        $boards = array();
        foreach($bride->getBoards() as $board){
            $boards[] = $board->toSummary($bride->id);
        }

        return response()->json([
            'status' => 'OK',
            'bride' => $bride->toProfile($bride->id),
            'boards' => $boards
        ]);
    }

    public function updateProfile(Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Bride account not found.'], 404);
        }

        if($request->has('displayname') && trim($request->displayname) != ""){
            $bride->displayname = $request->displayname;
        }
        if($request->has('bio')){
            $bride->bio = $request->bio;
        }
        if($request->has('wedding_date')){
            $bride->wedding_date = $request->wedding_date ? $request->wedding_date : null;
        }
        $bride->save();

        return response()->json([
            'status' => 'OK',
            'bride' => $bride->toProfile($bride->id)
        ]);
    }

    /**
     * Upload / replace the bride's profile photo.  Mirrors the vendor logo
     * upload: the image is stored under the public disk and resized to a
     * square avatar served via the /storage symlink.
     */
    public function uploadAvatar(Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Bride account not found.'], 404);
        }

        if(!$request->hasFile('file')){
            return response()->json(['status' => 'Error', 'message' => 'No image was uploaded.']);
        }

        $path = $request->file('file')->store('public/avatars/' . $bride->id);
        $pathinfo = pathinfo($path);

        $destinationpath = storage_path() . '/app/public/avatars/' . $bride->id;
        $publicpath = '/avatars/' . $bride->id;

        Image::make(storage_path() . '/app/' . $path, array(
            'width' => 240,
            'height' => 240,
            'crop' => true
        ))->save($destinationpath . '/' . 'avatar_' . $pathinfo['basename']);

        $bride->avatar = $publicpath . "/avatar_" . $pathinfo['basename'];
        $bride->save();

        return response()->json([
            'status' => 'OK',
            'avatar' => $bride->avatar
        ]);
    }

    public function getPublicProfile($slug){
        $bride = Bride::where('slug', '=', $slug)->first();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Profile not found.'], 404);
        }

        $viewer = $this->currentBride();
        $viewerId = $viewer ? $viewer->id : null;

        $boardModels = ($viewerId == $bride->id) ? $bride->getBoards() : $bride->getPublicBoards();
        $boards = array();
        foreach($boardModels as $board){
            $boards[] = $board->toSummary($viewerId);
        }

        return response()->json([
            'status' => 'OK',
            'bride' => $bride->toProfile($viewerId),
            'boards' => $boards
        ]);
    }

    // ---------------------------------------------------------------------
    // Feed / explore
    // ---------------------------------------------------------------------

    public function getFeed(){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Bride account not found.'], 404);
        }

        $following = $bride->followingIds();

        $feedModels = array();
        if(count($following) > 0){
            $feedModels = InspirationBoard::where('is_public', '=', true)
                ->whereIn('bride_id', $following)
                ->orderBy('updated_at', 'desc')->take(50)->get();
        }

        $feed = array();
        foreach($feedModels as $board){
            $feed[] = $board->toSummary($bride->id);
        }

        //Recent public boards from other brides, to keep the page lively even
        //when you follow no one yet.
        $exploreModels = InspirationBoard::where('is_public', '=', true)
            ->where('bride_id', '!=', $bride->id)
            ->orderBy('created_at', 'desc')->take(30)->get();
        $explore = array();
        foreach($exploreModels as $board){
            $explore[] = $board->toSummary($bride->id);
        }

        //Suggested brides to follow: recent brides you don't already follow.
        $excludeIds = $following;
        $excludeIds[] = $bride->id;
        $suggestedModels = Bride::whereNotIn('id', $excludeIds)
            ->orderBy('created_at', 'desc')->take(8)->get();
        $suggested = array();
        foreach($suggestedModels as $b){
            $suggested[] = $b->toProfile($bride->id);
        }

        return response()->json([
            'status' => 'OK',
            'feed' => $feed,
            'explore' => $explore,
            'suggested' => $suggested
        ]);
    }

    public function getExplore(Request $request){
        $viewer = $this->currentBride();
        $viewerId = $viewer ? $viewer->id : null;

        $boardModels = InspirationBoard::where('is_public', '=', true)
            ->orderBy('created_at', 'desc')->take(50)->get();
        $boards = array();
        foreach($boardModels as $board){
            $boards[] = $board->toSummary($viewerId);
        }

        return response()->json([
            'status' => 'OK',
            'boards' => $boards
        ]);
    }

    // ---------------------------------------------------------------------
    // Boards
    // ---------------------------------------------------------------------

    public function createBoard(Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Bride account not found.'], 404);
        }

        if(trim($request->title) == ""){
            return response()->json(['status' => 'Error', 'message' => 'Please give your board a title.']);
        }

        $board = new InspirationBoard;
        $board->bride_id = $bride->id;
        $board->title = $request->title;
        $board->description = $request->description;
        $board->is_public = $request->has('is_public') ? (bool) $request->is_public : true;
        $board->slug = $this->uniqueSlug($bride->slug . "-" . $request->title, InspirationBoard::class);
        $board->save();

        //Optionally seed the board with a first inspiration image.
        if($request->has('media_id') && $request->media_id){
            $media = Media::find($request->media_id);
            if($media){
                $item = new BoardItem;
                $item->board_id = $board->id;
                $item->media_id = $media->id;
                $item->save();
            }
        }

        return response()->json([
            'status' => 'OK',
            'board' => $board->toSummary($bride->id)
        ]);
    }

    public function updateBoard($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null || $board->bride_id != $bride->id){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        if($request->has('title') && trim($request->title) != ""){
            $board->title = $request->title;
        }
        if($request->has('description')){
            $board->description = $request->description;
        }
        if($request->has('is_public')){
            $board->is_public = (bool) $request->is_public;
        }
        if($request->has('cover_media_id')){
            $board->cover_media_id = $request->cover_media_id ? $request->cover_media_id : null;
        }
        $board->save();

        return response()->json([
            'status' => 'OK',
            'board' => $board->toSummary($bride->id)
        ]);
    }

    public function deleteBoard($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null || $board->bride_id != $bride->id){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        BoardItem::where('board_id', '=', $board->id)->delete();
        BoardLike::where('board_id', '=', $board->id)->delete();
        BoardComment::where('board_id', '=', $board->id)->delete();
        $board->delete();

        return response()->json(['status' => 'OK']);
    }

    public function getBoard($slug){
        $board = InspirationBoard::where('slug', '=', $slug)->first();
        if($board == null){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        $viewer = $this->currentBride();
        $viewerId = $viewer ? $viewer->id : null;

        //Private boards are only visible to their owner.
        if(!$board->is_public && $board->bride_id != $viewerId){
            return response()->json(['status' => 'Error', 'message' => 'This board is private.'], 403);
        }

        $items = array();
        foreach($board->getItems() as $item){
            if($item->media == null){
                continue;
            }
            $items[] = [
                'id' => $item->id,
                'media_id' => $item->media_id,
                'note' => $item->note,
                'thumbnail' => $item->media->thumbnailpath,
                'image' => $item->media->urlpath,
            ];
        }

        $comments = array();
        $commentModels = BoardComment::where('board_id', '=', $board->id)
            ->orderBy('created_at', 'asc')->get();
        foreach($commentModels as $comment){
            $comments[] = $comment->toArrayWithAuthor();
        }

        $summary = $board->toSummary($viewerId);
        $summary['items_list'] = $items;
        $summary['comments_list'] = $comments;
        $summary['isowner'] = ($viewerId != null && $viewerId == $board->bride_id);

        return response()->json([
            'status' => 'OK',
            'board' => $summary
        ]);
    }

    /**
     * List the current bride's boards, optionally flagging which ones already
     * contain a given media item (used by the "Save inspiration" picker).
     */
    public function getMyBoards(Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        if($bride == null){
            return response()->json(['status' => 'Error', 'message' => 'Bride account not found.'], 404);
        }

        $mediaId = $request->media_id;
        $boards = array();
        foreach($bride->getBoards() as $board){
            $summary = $board->toSummary($bride->id);
            if($mediaId){
                $summary['contains'] = BoardItem::where('board_id', '=', $board->id)
                    ->where('media_id', '=', $mediaId)->exists();
            }
            $boards[] = $summary;
        }

        return response()->json([
            'status' => 'OK',
            'boards' => $boards
        ]);
    }

    // ---------------------------------------------------------------------
    // Board items (saving inspiration)
    // ---------------------------------------------------------------------

    public function addBoardItem($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null || $board->bride_id != $bride->id){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        $media = Media::find($request->media_id);
        if($media == null){
            return response()->json(['status' => 'Error', 'message' => 'Inspiration not found.'], 404);
        }

        $existing = BoardItem::where('board_id', '=', $board->id)
            ->where('media_id', '=', $media->id)->first();
        if($existing == null){
            $item = new BoardItem;
            $item->board_id = $board->id;
            $item->media_id = $media->id;
            $item->note = $request->note;
            $item->save();

            //Bump the board so it surfaces in feeds as freshly updated.
            $board->touch();
        }

        return response()->json([
            'status' => 'OK',
            'items' => $board->itemCount()
        ]);
    }

    public function removeBoardItem($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null || $board->bride_id != $bride->id){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        BoardItem::where('board_id', '=', $board->id)
            ->where('media_id', '=', $request->media_id)->delete();

        return response()->json([
            'status' => 'OK',
            'items' => $board->itemCount()
        ]);
    }

    // ---------------------------------------------------------------------
    // Follows
    // ---------------------------------------------------------------------

    public function followBride($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $target = Bride::find($id);

        if($bride == null || $target == null){
            return response()->json(['status' => 'Error', 'message' => 'Profile not found.'], 404);
        }
        if($target->id == $bride->id){
            return response()->json(['status' => 'Error', 'message' => 'You cannot follow yourself.']);
        }

        $existing = BrideFollow::where('bride_id', '=', $bride->id)
            ->where('following_bride_id', '=', $target->id)->first();
        if($existing == null){
            $follow = new BrideFollow;
            $follow->bride_id = $bride->id;
            $follow->following_bride_id = $target->id;
            $follow->save();
        }

        return response()->json([
            'status' => 'OK',
            'isfollowing' => true,
            'followers' => $target->followerCount()
        ]);
    }

    public function unfollowBride($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $target = Bride::find($id);

        if($bride == null || $target == null){
            return response()->json(['status' => 'Error', 'message' => 'Profile not found.'], 404);
        }

        BrideFollow::where('bride_id', '=', $bride->id)
            ->where('following_bride_id', '=', $target->id)->delete();

        return response()->json([
            'status' => 'OK',
            'isfollowing' => false,
            'followers' => $target->followerCount()
        ]);
    }

    // ---------------------------------------------------------------------
    // Likes
    // ---------------------------------------------------------------------

    public function likeBoard($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        $existing = BoardLike::where('bride_id', '=', $bride->id)
            ->where('board_id', '=', $board->id)->first();
        if($existing == null){
            $like = new BoardLike;
            $like->bride_id = $bride->id;
            $like->board_id = $board->id;
            $like->save();
        }

        return response()->json([
            'status' => 'OK',
            'isliked' => true,
            'likes' => $board->likeCount()
        ]);
    }

    public function unlikeBoard($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }

        BoardLike::where('bride_id', '=', $bride->id)
            ->where('board_id', '=', $board->id)->delete();

        return response()->json([
            'status' => 'OK',
            'isliked' => false,
            'likes' => $board->likeCount()
        ]);
    }

    // ---------------------------------------------------------------------
    // Comments
    // ---------------------------------------------------------------------

    public function addComment($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $board = InspirationBoard::find($id);

        if($bride == null || $board == null){
            return response()->json(['status' => 'Error', 'message' => 'Board not found.'], 404);
        }
        if(trim($request->body) == ""){
            return response()->json(['status' => 'Error', 'message' => 'Comment cannot be empty.']);
        }

        $comment = new BoardComment;
        $comment->board_id = $board->id;
        $comment->bride_id = $bride->id;
        $comment->body = $request->body;
        $comment->save();

        return response()->json([
            'status' => 'OK',
            'comment' => $comment->toArrayWithAuthor(),
            'comments' => $board->commentCount()
        ]);
    }

    public function deleteComment($id, Request $request){
        $user = JWTAuth::parseToken()->authenticate();
        $bride = $user->findBride();
        $comment = BoardComment::find($id);

        if($bride == null || $comment == null){
            return response()->json(['status' => 'Error', 'message' => 'Comment not found.'], 404);
        }

        $board = InspirationBoard::find($comment->board_id);
        //A comment can be removed by its author or by the board owner.
        $canDelete = ($comment->bride_id == $bride->id) || ($board && $board->bride_id == $bride->id);
        if(!$canDelete){
            return response()->json(['status' => 'Error', 'message' => 'You cannot remove this comment.'], 403);
        }

        $comment->delete();

        return response()->json(['status' => 'OK']);
    }
}
