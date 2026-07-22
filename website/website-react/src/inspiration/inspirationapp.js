import React, {Component} from 'react';
import BrideApi from './brideapi';
import {Avatar} from './components';
import Feed from './feed';
import BoardView from './boardview';
import ProfileView from './profileview';
import BrideAuth from './auth';

/*
 * Root of the bride social "inspiration" experience.  A lightweight in-page
 * router (via the URL hash, so board/profile links are shareable) switches
 * between the feed, a board, and a profile.  Auth is shown as an overlay when
 * a logged-out visitor tries to do something social.
 */
export default class InspirationApp extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            view: "feed",     // feed | board | profile
            param: null,      // slug for board/profile
            currentBride: null,
            ready: false,
            showAuth: false,
            showCreate: false,
            newBoardTitle: ""
        };
    }

    componentDidMount(){
        window.addEventListener("hashchange", this.onHashChange);
        this.applyHash();

        if(this.api.isLoggedIn()){
            this.api.get("brides/me").then((res) => {
                if(res.status == "OK"){
                    this.setState({currentBride: res.bride, ready: true});
                }else{
                    //Token invalid/expired
                    BrideApi.clearToken();
                    this.setState({ready: true});
                }
            }).catch(() => {
                this.setState({ready: true});
            });
        }else{
            this.setState({ready: true});
        }
    }

    componentWillUnmount(){
        window.removeEventListener("hashchange", this.onHashChange);
    }

    onHashChange = () => {
        this.applyHash();
    }

    applyHash = () => {
        var hash = window.location.hash.replace(/^#/, "");
        if(hash.indexOf("board/") == 0){
            this.setState({view: "board", param: hash.substring(6)});
        }else if(hash.indexOf("profile/") == 0){
            this.setState({view: "profile", param: hash.substring(8)});
        }else{
            this.setState({view: "feed", param: null});
        }
    }

    navigate = (view, param) => {
        var hash = "";
        if(view == "board"){ hash = "#board/" + param; }
        else if(view == "profile"){ hash = "#profile/" + param; }
        else { hash = "#"; }
        //Setting the hash triggers onHashChange which updates the view.
        if(window.location.hash == hash || (hash == "#" && window.location.hash == "")){
            this.setState({view: view, param: param});
        }else{
            window.location.hash = hash;
        }
    }

    openBoard = (slug) => { this.navigate("board", slug); }
    openProfile = (slug) => { this.navigate("profile", slug); }
    goFeed = () => { this.navigate("feed"); }

    requireAuth = () => {
        this.setState({showAuth: true});
    }

    onAuthed = (bride) => {
        //Rebuild api client so it picks up the new token, then refresh.
        this.api = new BrideApi();
        this.setState({currentBride: bride, showAuth: false}, () => {
            //Force child views to reload with the authenticated context.
            this.forceRemount();
        });
    }

    forceRemount = () => {
        //Toggling ready remounts the current view subtree cleanly.
        this.setState({ready: false}, () => this.setState({ready: true}));
    }

    onProfileUpdated = (bride) => {
        //Keep the header avatar / name in sync when the bride edits her own profile.
        if(this.state.currentBride && bride && this.state.currentBride.id == bride.id){
            this.setState({currentBride: bride});
        }
    }

    logout = () => {
        BrideApi.clearToken();
        this.api = new BrideApi();
        this.setState({currentBride: null}, () => {
            this.goFeed();
            this.forceRemount();
        });
    }

    createBoard = () => {
        if(this.state.newBoardTitle.trim() == ""){ return; }
        this.api.post("brides/boards", {title: this.state.newBoardTitle, is_public: 1}).then((res) => {
            if(res.status == "OK"){
                this.setState({showCreate: false, newBoardTitle: ""});
                this.openBoard(res.board.slug);
            }else{
                alert(res.message ? res.message : "Could not create the board.");
            }
        }).catch(() => alert("Could not create the board."));
    }

    render(){
        if(!this.state.ready){
            return <div className="inspirationapp"><div className="feed loading">Loading&hellip;</div></div>;
        }

        var bride = this.state.currentBride;

        return (
            <div className="inspirationapp">
                <div className="inspirationheader">
                    <div className="innerwrapper">
                        <a className="brand" onClick={this.goFeed}><i className="fa fa-heart"></i> Inspiration</a>
                        <nav>
                            <a onClick={this.goFeed}>Feed</a>
                            <a href="/gallery">Browse Gallery</a>
                            {bride ?
                                <span className="loggedin">
                                    <a onClick={() => this.setState({showCreate: true})}><i className="fa fa-plus"></i> New Board</a>
                                    <a onClick={() => this.openProfile(bride.slug)}>My Profile</a>
                                    <a onClick={this.logout}>Log out</a>
                                    <Avatar src={bride.avatar} name={bride.displayname} size={34} onClick={() => this.openProfile(bride.slug)} />
                                </span> :
                                <a className="loginlink" onClick={this.requireAuth}>Log in / Sign up</a>
                            }
                        </nav>
                    </div>
                </div>

                <div className="inspirationbody innerwrapper">
                    {this.state.view == "feed" ?
                        <Feed currentBride={bride}
                            onOpenBoard={this.openBoard}
                            onOpenProfile={this.openProfile}
                            onNeedAuth={this.requireAuth} /> : null
                    }
                    {this.state.view == "board" ?
                        <BoardView slug={this.state.param} currentBride={bride}
                            onBack={this.goFeed}
                            onOpenProfile={this.openProfile}
                            onDeleted={this.goFeed}
                            onNeedAuth={this.requireAuth} /> : null
                    }
                    {this.state.view == "profile" ?
                        <ProfileView slug={this.state.param} currentBride={bride}
                            onBack={this.goFeed}
                            onOpenBoard={this.openBoard}
                            onOpenProfile={this.openProfile}
                            onProfileUpdated={this.onProfileUpdated}
                            onNeedAuth={this.requireAuth} /> : null
                    }
                </div>

                {this.state.showAuth ?
                    <div className="bt-modaloverlay" onClick={() => this.setState({showAuth: false})}>
                        <div className="bt-modal authmodal" onClick={(e) => e.stopPropagation()}>
                            <a className="closebtn" onClick={() => this.setState({showAuth: false})}><i className="fa fa-times"></i></a>
                            <BrideAuth onAuthed={this.onAuthed} />
                        </div>
                    </div> : null
                }

                {this.state.showCreate ?
                    <div className="bt-modaloverlay" onClick={() => this.setState({showCreate: false})}>
                        <div className="bt-modal createmodal" onClick={(e) => e.stopPropagation()}>
                            <header>
                                <h2>Create a Board</h2>
                                <a className="closebtn" onClick={() => this.setState({showCreate: false})}><i className="fa fa-times"></i></a>
                            </header>
                            <p>Boards are shareable collections of inspiration &mdash; like "Ceremony", "Florals" or "Reception".</p>
                            <input type="text" placeholder="Board name" value={this.state.newBoardTitle}
                                onChange={(e) => this.setState({newBoardTitle: e.target.value})}
                                onKeyPress={(e) => { if(e.key == "Enter"){ this.createBoard(); } }} />
                            <a className="btn block" onClick={this.createBoard}>Create Board</a>
                        </div>
                    </div> : null
                }
            </div>
        );
    }
}
