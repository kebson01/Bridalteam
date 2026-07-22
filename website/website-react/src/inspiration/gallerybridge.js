import React, {Component} from 'react';
import BrideApi from './brideapi';
import SaveToBoard from './savetoboard';
import BrideAuth from './auth';

/*
 * Bridges the jQuery gallery lightbox to the React social features.  It mounts
 * silently on the gallery page and exposes window.BTSaveInspiration(mediaId,
 * thumb) so the gallery's "Save to Board" button can open the save modal
 * (prompting login first when needed).
 */
export default class GalleryBridge extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            open: false,
            showAuth: false,
            mediaId: null,
            mediaThumb: null
        };
    }

    componentDidMount(){
        window.BTSaveInspiration = (mediaId, mediaThumb) => {
            if(new BrideApi().isLoggedIn()){
                this.setState({open: true, mediaId: mediaId, mediaThumb: mediaThumb, showAuth: false});
            }else{
                this.setState({showAuth: true, mediaId: mediaId, mediaThumb: mediaThumb, open: false});
            }
        };
        window.BTIsBrideLoggedIn = () => new BrideApi().isLoggedIn();
    }

    onAuthed = () => {
        this.api = new BrideApi();
        //Proceed straight into saving the image they were trying to save.
        this.setState({showAuth: false, open: true});
    }

    close = () => {
        this.setState({open: false, showAuth: false});
    }

    render(){
        if(this.state.open){
            return (
                <SaveToBoard mediaId={this.state.mediaId} mediaThumb={this.state.mediaThumb} onClose={this.close} />
            );
        }
        if(this.state.showAuth){
            return (
                <div className="bt-modaloverlay" onClick={this.close}>
                    <div className="bt-modal authmodal" onClick={(e) => e.stopPropagation()}>
                        <a className="closebtn" onClick={this.close}><i className="fa fa-times"></i></a>
                        <BrideAuth onAuthed={this.onAuthed} />
                    </div>
                </div>
            );
        }
        return null;
    }
}
