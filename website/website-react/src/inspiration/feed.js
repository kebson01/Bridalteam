import React, {Component} from 'react';
import BrideApi from './brideapi';
import {BoardCard, SuggestedBride} from './components';

/*
 * The main social feed.  For a logged-in bride it shows boards from the brides
 * she follows, a lively "Explore" stream of public boards and a list of brides
 * to follow.  Logged-out visitors see the public Explore stream.
 */
export default class Feed extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            loading: true,
            feed: [],
            explore: [],
            suggested: [],
            loggedIn: this.api.isLoggedIn()
        };
    }

    componentDidMount(){
        this.load();
    }

    load = () => {
        if(this.api.isLoggedIn()){
            this.api.get("brides/feed").then((res) => {
                if(res.status == "OK"){
                    this.setState({feed: res.feed, explore: res.explore, suggested: res.suggested, loading: false});
                }else{
                    this.setState({loading: false});
                }
            }).catch(() => this.setState({loading: false}));
        }else{
            this.api.get("brides/explore").then((res) => {
                if(res.status == "OK"){
                    this.setState({explore: res.boards, loading: false});
                }else{
                    this.setState({loading: false});
                }
            }).catch(() => this.setState({loading: false}));
        }
    }

    likeBoard = (board, listName) => {
        if(!this.api.isLoggedIn()){ this.props.onNeedAuth(); return; }
        var action = board.isliked ? "unlike" : "like";
        this.api.post("brides/boards/" + board.id + "/" + action, null).then((res) => {
            if(res.status == "OK"){
                var list = this.state[listName].map((b) => {
                    if(b.id == board.id){ b.isliked = res.isliked; b.likes = res.likes; }
                    return b;
                });
                var s = {}; s[listName] = list; this.setState(s);
            }
        });
    }

    toggleFollow = (bride) => {
        if(!this.api.isLoggedIn()){ this.props.onNeedAuth(); return; }
        var action = bride.isfollowing ? "unfollow" : "follow";
        this.api.post("brides/" + action + "/" + bride.id, null).then((res) => {
            if(res.status == "OK"){
                var suggested = this.state.suggested.map((b) => {
                    if(b.id == bride.id){ b.isfollowing = res.isfollowing; b.followers = res.followers; }
                    return b;
                });
                this.setState({suggested: suggested});
            }
        });
    }

    renderGrid = (boards, listName) => {
        return (
            <div className="boardgrid">
                {boards.map((board) => {
                    return (
                        <BoardCard key={board.id} board={board}
                            onOpen={this.props.onOpenBoard}
                            onOpenProfile={this.props.onOpenProfile}
                            onLike={(b) => this.likeBoard(b, listName)} />
                    );
                })}
            </div>
        );
    }

    render(){
        if(this.state.loading){
            return <div className="feed loading">Loading inspiration&hellip;</div>;
        }

        return (
            <div className="feed">
                {this.state.suggested && this.state.suggested.length > 0 ?
                    <div className="suggestedrow">
                        <h2>Brides to follow</h2>
                        <div className="suggestedlist">
                            {this.state.suggested.map((bride) => {
                                return <SuggestedBride key={bride.id} bride={bride}
                                    onOpenProfile={this.props.onOpenProfile}
                                    onToggleFollow={this.toggleFollow} />;
                            })}
                        </div>
                    </div> : null
                }

                {this.state.feed && this.state.feed.length > 0 ?
                    <div className="feedsection">
                        <h2>From brides you follow</h2>
                        {this.renderGrid(this.state.feed, "feed")}
                    </div> : null
                }

                <div className="feedsection">
                    <h2>{this.state.loggedIn ? "Explore inspiration" : "Explore wedding inspiration"}</h2>
                    {this.state.explore && this.state.explore.length > 0 ?
                        this.renderGrid(this.state.explore, "explore") :
                        <p className="empty">No inspiration boards have been shared yet. Be the first &mdash; browse the gallery and save images to a board!</p>
                    }
                </div>
            </div>
        );
    }
}
