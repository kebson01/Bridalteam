import React, {Component} from 'react';
import BrideApi from './brideapi';

/*
 * Modal that lets a logged-in bride save a piece of inspiration (gallery
 * media) into one or more of her boards, or create a new board on the spot.
 */
export default class SaveToBoard extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            loading: true,
            boards: [],
            newtitle: "",
            creating: false,
            busy: false
        };
    }

    componentDidMount(){
        this.loadBoards();
    }

    loadBoards = () => {
        this.api.get("brides/myboards?media_id=" + this.props.mediaId).then((res) => {
            if(res.status == "OK"){
                this.setState({boards: res.boards, loading: false});
            }else{
                this.setState({loading: false});
            }
        }).catch(() => {
            this.setState({loading: false});
        });
    }

    toggleBoard = (board) => {
        if(this.state.busy){ return; }
        this.setState({busy: true});
        var action = board.contains ? "items/remove" : "items";
        this.api.post("brides/boards/" + board.id + "/" + action, {media_id: this.props.mediaId}).then((res) => {
            if(res.status == "OK"){
                var boards = this.state.boards.map((b) => {
                    if(b.id == board.id){
                        b.contains = !board.contains;
                        b.items = res.items;
                    }
                    return b;
                });
                this.setState({boards: boards, busy: false});
            }else{
                this.setState({busy: false});
                alert(res.message ? res.message : "Something went wrong. Please try again.");
            }
        }).catch(() => {
            this.setState({busy: false});
            alert("Something went wrong. Please try again.");
        });
    }

    createBoard = () => {
        if(this.state.newtitle.trim() == ""){ return; }
        this.setState({busy: true});
        this.api.post("brides/boards", {
            title: this.state.newtitle,
            media_id: this.props.mediaId,
            is_public: true
        }).then((res) => {
            if(res.status == "OK"){
                this.setState({newtitle: "", creating: false, busy: false});
                this.loadBoards();
            }else{
                this.setState({busy: false});
                alert(res.message ? res.message : "Could not create the board.");
            }
        }).catch(() => {
            this.setState({busy: false});
            alert("Could not create the board.");
        });
    }

    render(){
        return (
            <div className="bt-modaloverlay" onClick={this.props.onClose}>
                <div className="bt-modal savetoboard" onClick={(e) => e.stopPropagation()}>
                    <header>
                        <h2>Save Inspiration</h2>
                        <a className="closebtn" onClick={this.props.onClose}><i className="fa fa-times"></i></a>
                    </header>
                    {this.props.mediaThumb ?
                        <div className="previewimg"><img src={"/storage" + this.props.mediaThumb} /></div> : null
                    }
                    {this.state.loading ?
                        <div className="loading">Loading your boards&hellip;</div> :
                        <div className="boardlist">
                            {this.state.boards.length == 0 && !this.state.creating ?
                                <p className="empty">You don't have any boards yet. Create one to start saving inspiration.</p> : null
                            }
                            {this.state.boards.map((board) => {
                                return (
                                    <div key={board.id} className={"boardrow" + (board.contains ? " saved" : "")} onClick={() => this.toggleBoard(board)}>
                                        <span className="title">{board.title}</span>
                                        <span className="count">{board.items} pins</span>
                                        <span className="check">
                                            {board.contains ? <i className="fa fa-check-circle"></i> : <i className="fa fa-plus-circle"></i>}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    }
                    {this.state.creating ?
                        <div className="createboard">
                            <input type="text" placeholder="New board name (e.g. Ceremony, Florals)" value={this.state.newtitle}
                                onChange={(e) => this.setState({newtitle: e.target.value})} />
                            <div className="actions">
                                <a className="btn" onClick={this.createBoard}>Create &amp; Save</a>
                                <a className="link" onClick={() => this.setState({creating: false, newtitle: ""})}>Cancel</a>
                            </div>
                        </div> :
                        <a className="createlink" onClick={() => this.setState({creating: true})}>
                            <i className="fa fa-plus"></i> Create a new board
                        </a>
                    }
                </div>
            </div>
        );
    }
}
