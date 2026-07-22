import React, {Component} from 'react';
import BrideApi from './brideapi';
import {Avatar} from './components';

/*
 * Full view of a single inspiration board: its images, description, likes,
 * comments and share link.  Owners get inline controls to remove images,
 * toggle visibility and delete the board.
 */
export default class BoardView extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            loading: true,
            board: null,
            error: "",
            commentText: "",
            copied: false
        };
    }

    componentDidMount(){
        this.load();
    }

    componentWillReceiveProps(next){
        if(next.slug != this.props.slug){
            this.setState({loading: true, board: null}, this.load);
        }
    }

    load = () => {
        this.api.get("brides/board/" + this.props.slug).then((res) => {
            if(res.status == "OK"){
                this.setState({board: res.board, loading: false});
            }else{
                this.setState({error: res.message ? res.message : "Board not found.", loading: false});
            }
        }).catch(() => {
            this.setState({error: "Board not found.", loading: false});
        });
    }

    toggleLike = () => {
        if(!this.api.isLoggedIn()){ this.props.onNeedAuth(); return; }
        var board = this.state.board;
        var action = board.isliked ? "unlike" : "like";
        this.api.post("brides/boards/" + board.id + "/" + action, null).then((res) => {
            if(res.status == "OK"){
                board.isliked = res.isliked;
                board.likes = res.likes;
                this.setState({board: board});
            }
        });
    }

    shareLink = () => {
        var url = window.location.origin + "/inspiration#board/" + this.state.board.slug;
        var input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        try { document.execCommand("copy"); } catch(e) {}
        document.body.removeChild(input);
        this.setState({copied: true});
        setTimeout(() => this.setState({copied: false}), 2500);
    }

    addComment = () => {
        if(!this.api.isLoggedIn()){ this.props.onNeedAuth(); return; }
        if(this.state.commentText.trim() == ""){ return; }
        var board = this.state.board;
        this.api.post("brides/boards/" + board.id + "/comments", {body: this.state.commentText}).then((res) => {
            if(res.status == "OK"){
                if(!board.comments_list){ board.comments_list = []; }
                board.comments_list.push(res.comment);
                board.comments = res.comments;
                this.setState({board: board, commentText: ""});
            }else{
                alert(res.message ? res.message : "Could not post your comment.");
            }
        });
    }

    deleteComment = (comment) => {
        if(!confirm("Remove this comment?")){ return; }
        this.api.post("brides/comments/" + comment.id + "/delete", null).then((res) => {
            if(res.status == "OK"){
                var board = this.state.board;
                board.comments_list = board.comments_list.filter((c) => c.id != comment.id);
                board.comments = board.comments_list.length;
                this.setState({board: board});
            }
        });
    }

    removeItem = (item) => {
        if(!confirm("Remove this image from the board?")){ return; }
        var board = this.state.board;
        this.api.post("brides/boards/" + board.id + "/items/remove", {media_id: item.media_id}).then((res) => {
            if(res.status == "OK"){
                board.items_list = board.items_list.filter((i) => i.id != item.id);
                board.items = res.items;
                this.setState({board: board});
            }
        });
    }

    toggleVisibility = () => {
        var board = this.state.board;
        var makePublic = !board.is_public;
        this.api.post("brides/boards/" + board.id + "/update", {is_public: makePublic ? 1 : 0}).then((res) => {
            if(res.status == "OK"){
                board.is_public = res.board.is_public;
                this.setState({board: board});
            }
        });
    }

    deleteBoard = () => {
        if(!confirm("Delete this board permanently? This cannot be undone.")){ return; }
        this.api.post("brides/boards/" + this.state.board.id + "/delete", null).then((res) => {
            if(res.status == "OK"){
                if(this.props.onDeleted){ this.props.onDeleted(); }
            }
        });
    }

    render(){
        if(this.state.loading){
            return <div className="boardview loading">Loading board&hellip;</div>;
        }
        if(this.state.error){
            return (
                <div className="boardview error">
                    <p>{this.state.error}</p>
                    <a className="btn" onClick={this.props.onBack}>Back to feed</a>
                </div>
            );
        }
        var board = this.state.board;
        return (
            <div className="boardview">
                <a className="backlink" onClick={this.props.onBack}><i className="fa fa-arrow-left"></i> Back</a>
                <div className="boardheader">
                    <div className="titleblock">
                        <h1>{board.title} {!board.is_public ? <span className="privatetag"><i className="fa fa-lock"></i> Private</span> : null}</h1>
                        {board.description ? <p className="desc">{board.description}</p> : null}
                        {board.owner ?
                            <div className="owner" onClick={() => this.props.onOpenProfile(board.owner.slug)}>
                                <Avatar src={board.owner.avatar} name={board.owner.displayname} size={34} />
                                <span>{board.owner.displayname}</span>
                            </div> : null
                        }
                    </div>
                    <div className="boardstats">
                        <a className={"like" + (board.isliked ? " liked" : "")} onClick={this.toggleLike}>
                            <i className={board.isliked ? "fa fa-heart" : "fa fa-heart-o"}></i> {board.likes}
                        </a>
                        <span className="stat"><i className="fa fa-picture-o"></i> {board.items}</span>
                        <span className="stat"><i className="fa fa-comment-o"></i> {board.comments}</span>
                        <a className="share" onClick={this.shareLink}>
                            <i className="fa fa-share-alt"></i> {this.state.copied ? "Link copied!" : "Share"}
                        </a>
                    </div>
                </div>

                {board.isowner ?
                    <div className="ownercontrols">
                        <a onClick={this.toggleVisibility}>
                            <i className={board.is_public ? "fa fa-lock" : "fa fa-globe"}></i>
                            {board.is_public ? " Make private" : " Make public"}
                        </a>
                        <a className="danger" onClick={this.deleteBoard}><i className="fa fa-trash"></i> Delete board</a>
                    </div> : null
                }

                <div className="boarditems">
                    {board.items_list && board.items_list.length > 0 ?
                        board.items_list.map((item) => {
                            return (
                                <div key={item.id} className="boarditem">
                                    {item.type === "video" ?
                                        <video src={"/storage" + item.image} controls preload="metadata" playsInline></video> :
                                        <img src={"/storage" + (item.thumbnail || item.image)} />
                                    }
                                    {board.isowner ?
                                        <a className="removeitem" onClick={() => this.removeItem(item)}><i className="fa fa-times"></i></a> : null
                                    }
                                </div>
                            );
                        }) :
                        <p className="empty">No inspiration saved to this board yet.</p>
                    }
                </div>

                <div className="boardcomments">
                    <h3>Comments</h3>
                    {this.api.isLoggedIn() ?
                        <div className="addcomment">
                            <input type="text" placeholder="Add a comment…" value={this.state.commentText}
                                onChange={(e) => this.setState({commentText: e.target.value})}
                                onKeyPress={(e) => { if(e.key == "Enter"){ this.addComment(); } }} />
                            <a className="btn" onClick={this.addComment}>Post</a>
                        </div> :
                        <p className="loginprompt"><a onClick={this.props.onNeedAuth}>Log in</a> to join the conversation.</p>
                    }
                    <div className="commentlist">
                        {board.comments_list && board.comments_list.length > 0 ?
                            board.comments_list.map((comment) => {
                                return (
                                    <div key={comment.id} className="commentrow">
                                        {comment.author ?
                                            <Avatar src={comment.author.avatar} name={comment.author.displayname} size={30}
                                                onClick={() => this.props.onOpenProfile(comment.author.slug)} /> : null
                                        }
                                        <div className="body">
                                            <span className="who">{comment.author ? comment.author.displayname : "Someone"}</span>
                                            <span className="text">{comment.body}</span>
                                        </div>
                                        {(board.isowner || (this.props.currentBride && comment.author && this.props.currentBride.id == comment.author.id)) ?
                                            <a className="del" onClick={() => this.deleteComment(comment)}><i className="fa fa-times"></i></a> : null
                                        }
                                    </div>
                                );
                            }) :
                            <p className="empty">No comments yet. Be the first!</p>
                        }
                    </div>
                </div>
            </div>
        );
    }
}
