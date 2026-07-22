import React, {Component} from 'react';

/*
 * Small presentational pieces shared across the inspiration social UI.
 */

export var Avatar = (props) => {
    var size = props.size ? props.size : 40;
    var style = {width: size, height: size, lineHeight: size + "px", fontSize: (size / 2.4) + "px"};
    if(props.src){
        return (
            <span className="bt-avatar" onClick={props.onClick} style={style}>
                <img src={"/storage" + props.src} style={{width: size, height: size}} />
            </span>
        );
    }
    var initials = "";
    if(props.name){
        var parts = props.name.trim().split(" ");
        initials = parts[0].charAt(0).toUpperCase();
        if(parts.length > 1){
            initials += parts[parts.length - 1].charAt(0).toUpperCase();
        }
    }
    return (
        <span className="bt-avatar initials" onClick={props.onClick} style={style}>{initials}</span>
    );
};

export class BoardCard extends Component{
    render(){
        var board = this.props.board;
        return (
            <div className="boardcard">
                <div className="cover" onClick={() => this.props.onOpen(board.slug)}>
                    {board.cover ?
                        <img src={"/storage" + board.cover} /> :
                        <div className="nocover"><i className="fa fa-heart-o"></i></div>
                    }
                    {!board.is_public ? <span className="privatebadge"><i className="fa fa-lock"></i> Private</span> : null}
                    <span className="itemcount">{board.items} {board.items == 1 ? "pin" : "pins"}</span>
                </div>
                <div className="cardbody">
                    <h3 onClick={() => this.props.onOpen(board.slug)}>{board.title}</h3>
                    {board.owner ?
                        <div className="owner" onClick={() => this.props.onOpenProfile(board.owner.slug)}>
                            <Avatar src={board.owner.avatar} name={board.owner.displayname} size={26} />
                            <span className="ownername">{board.owner.displayname}</span>
                        </div> : null
                    }
                    <div className="cardactions">
                        <a className={"like" + (board.isliked ? " liked" : "")} onClick={() => this.props.onLike(board)}>
                            <i className={board.isliked ? "fa fa-heart" : "fa fa-heart-o"}></i> {board.likes}
                        </a>
                        <a className="comment" onClick={() => this.props.onOpen(board.slug)}>
                            <i className="fa fa-comment-o"></i> {board.comments}
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}

export class SuggestedBride extends Component{
    render(){
        var bride = this.props.bride;
        return (
            <div className="suggestedbride">
                <Avatar src={bride.avatar} name={bride.displayname} size={44} onClick={() => this.props.onOpenProfile(bride.slug)} />
                <div className="info" onClick={() => this.props.onOpenProfile(bride.slug)}>
                    <span className="name">{bride.displayname}</span>
                    <span className="meta">{bride.boards} boards &middot; {bride.followers} followers</span>
                </div>
                <a className={"followbtn" + (bride.isfollowing ? " following" : "")} onClick={() => this.props.onToggleFollow(bride)}>
                    {bride.isfollowing ? "Following" : "Follow"}
                </a>
            </div>
        );
    }
}
