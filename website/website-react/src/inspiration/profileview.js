import React, {Component} from 'react';
import BrideApi from './brideapi';
import {Avatar, BoardCard} from './components';

/*
 * A bride's public profile: avatar, counts, follow button and her boards.
 */
export default class ProfileView extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            loading: true,
            bride: null,
            boards: [],
            error: "",
            editing: false,
            saving: false,
            uploading: false,
            form: {displayname: "", bio: "", wedding_date: ""}
        };
    }

    componentDidMount(){
        this.load();
    }

    componentWillReceiveProps(next){
        if(next.slug != this.props.slug){
            this.setState({loading: true, bride: null, boards: []}, this.load);
        }
    }

    load = () => {
        this.api.get("brides/profile/" + this.props.slug).then((res) => {
            if(res.status == "OK"){
                this.setState({bride: res.bride, boards: res.boards, loading: false});
            }else{
                this.setState({error: res.message ? res.message : "Profile not found.", loading: false});
            }
        }).catch(() => {
            this.setState({error: "Profile not found.", loading: false});
        });
    }

    openEditor = () => {
        var b = this.state.bride;
        this.setState({
            editing: true,
            form: {
                displayname: b.displayname || "",
                bio: b.bio || "",
                wedding_date: b.wedding_date || ""
            }
        });
    }

    handleFormChange = (e) => {
        var form = this.state.form;
        form[e.target.name] = e.target.value;
        this.setState({form: form});
    }

    saveProfile = () => {
        this.setState({saving: true});
        this.api.post("brides/me", this.state.form).then((res) => {
            if(res.status == "OK"){
                this.setState({bride: res.bride, editing: false, saving: false});
                if(this.props.onProfileUpdated){ this.props.onProfileUpdated(res.bride); }
            }else{
                this.setState({saving: false});
                alert(res.message ? res.message : "Could not save your profile.");
            }
        }).catch(() => {
            this.setState({saving: false});
            alert("Could not save your profile.");
        });
    }

    uploadAvatar = (e) => {
        var file = e.target.files[0];
        if(!file){ return; }
        var formdata = new FormData();
        formdata.append("file", file);
        this.setState({uploading: true});
        this.api.post("brides/me/avatar", formdata).then((res) => {
            this.setState({uploading: false});
            if(res.status == "OK"){
                var bride = this.state.bride;
                bride.avatar = res.avatar;
                this.setState({bride: bride});
                if(this.props.onProfileUpdated){ this.props.onProfileUpdated(bride); }
            }else{
                alert(res.message ? res.message : "Could not upload your photo.");
            }
        }).catch(() => {
            this.setState({uploading: false});
            alert("Could not upload your photo.");
        });
    }

    toggleFollow = () => {
        if(!this.api.isLoggedIn()){ this.props.onNeedAuth(); return; }
        var bride = this.state.bride;
        var action = bride.isfollowing ? "unfollow" : "follow";
        this.api.post("brides/" + action + "/" + bride.id, null).then((res) => {
            if(res.status == "OK"){
                bride.isfollowing = res.isfollowing;
                bride.followers = res.followers;
                this.setState({bride: bride});
            }
        });
    }

    likeBoard = (board) => {
        if(!this.api.isLoggedIn()){ this.props.onNeedAuth(); return; }
        var action = board.isliked ? "unlike" : "like";
        this.api.post("brides/boards/" + board.id + "/" + action, null).then((res) => {
            if(res.status == "OK"){
                var boards = this.state.boards.map((b) => {
                    if(b.id == board.id){ b.isliked = res.isliked; b.likes = res.likes; }
                    return b;
                });
                this.setState({boards: boards});
            }
        });
    }

    render(){
        if(this.state.loading){
            return <div className="profileview loading">Loading profile&hellip;</div>;
        }
        if(this.state.error){
            return (
                <div className="profileview error">
                    <p>{this.state.error}</p>
                    <a className="btn" onClick={this.props.onBack}>Back to feed</a>
                </div>
            );
        }
        var bride = this.state.bride;
        return (
            <div className="profileview">
                <a className="backlink" onClick={this.props.onBack}><i className="fa fa-arrow-left"></i> Back</a>
                <div className="profilehero">
                    <Avatar src={bride.avatar} name={bride.displayname} size={96} />
                    <h1>{bride.displayname}</h1>
                    {bride.bio ? <p className="bio">{bride.bio}</p> : null}
                    {bride.wedding_date ? <p className="weddingdate"><i className="fa fa-calendar"></i> Wedding: {bride.wedding_date}</p> : null}
                    <div className="counts">
                        <span><strong>{bride.boards}</strong> boards</span>
                        <span><strong>{bride.followers}</strong> followers</span>
                        <span><strong>{bride.following}</strong> following</span>
                    </div>
                    {!bride.isself ?
                        <a className={"followbtn" + (bride.isfollowing ? " following" : "")} onClick={this.toggleFollow}>
                            {bride.isfollowing ? "Following" : "Follow"}
                        </a> :
                        <a className="editprofilebtn" onClick={this.openEditor}><i className="fa fa-pencil"></i> Edit Profile</a>
                    }
                </div>
                <div className="boardgrid">
                    {this.state.boards.length > 0 ?
                        this.state.boards.map((board) => {
                            return (
                                <BoardCard key={board.id} board={board}
                                    onOpen={this.props.onOpenBoard}
                                    onOpenProfile={this.props.onOpenProfile}
                                    onLike={this.likeBoard} />
                            );
                        }) :
                        <p className="empty">No public boards yet.</p>
                    }
                </div>

                {this.state.editing ?
                    <div className="bt-modaloverlay" onClick={() => this.setState({editing: false})}>
                        <div className="bt-modal editprofile" onClick={(e) => e.stopPropagation()}>
                            <header>
                                <h2>Edit Profile</h2>
                                <a className="closebtn" onClick={() => this.setState({editing: false})}><i className="fa fa-times"></i></a>
                            </header>
                            <div className="avataredit">
                                <Avatar src={bride.avatar} name={bride.displayname} size={90} />
                                <label className="changephoto">
                                    {this.state.uploading ? "Uploading…" : "Change photo"}
                                    <input type="file" accept="image/*" onChange={this.uploadAvatar} style={{display: "none"}} />
                                </label>
                            </div>
                            <label className="fieldlabel">Display name</label>
                            <input type="text" name="displayname" value={this.state.form.displayname} onChange={this.handleFormChange} />
                            <label className="fieldlabel">Bio</label>
                            <textarea name="bio" value={this.state.form.bio} onChange={this.handleFormChange} placeholder="Tell other brides a little about yourself…"></textarea>
                            <label className="fieldlabel">Wedding date</label>
                            <input type="date" name="wedding_date" value={this.state.form.wedding_date} onChange={this.handleFormChange} />
                            <a className={"btn block" + (this.state.saving ? " busy" : "")} onClick={this.state.saving ? null : this.saveProfile}>
                                {this.state.saving ? "Saving…" : "Save Profile"}
                            </a>
                        </div>
                    </div> : null
                }
            </div>
        );
    }
}
