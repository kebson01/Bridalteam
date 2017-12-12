import React from 'react';
import Api from './api';

export default class MediaManagement extends React.Component{
    constructor(props){
        super(props);

        this.api = new Api();
        this.state = {
            media: []
        };
    }

    componentDidMount(){
        this.getMedia();
    }

    getMedia = () => {
        this.api.get('mediareview').then((res) => {
            this.setState({
                media: res.media
            });

            console.log(this.state.media);
        })
    }

    isMediaApproved = (val) => {
        if(val == null){
            return "NOT REVIEWED";
        }else{
            if(val == 1){
                return "APPROVED";
            }else{
                return "DENIED";
            }
        }
    }

    render() {
        return(
            <div id="bridalteam_admin">
                <div id="bridalteam_admin_media" style={{marginTop: "30px"}}>
                    <table className="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <td width="3%">ID</td>
                                <td width="6%">Thumbnail</td>
                                <td width="5%">Status</td>
                                <td width="15%">From Vendor</td>                                
                                <td width="5%">Type</td>                                                                
                                <td width="10%">Keywords</td>
                                <td width="10%">Updated At</td>
                                                                           
                            </tr>
                        </thead>
                        <tbody>
                            {this.state.media.map((media, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{media.id}</td>
                                        {media.media.square_thumbnailpath != null ?
                                            <td>
                                                <img width="100px" src={"http://bridalteam.dev/storage" + media.media.square_thumbnailpath} /><br/>
                                                <a href={"admin.php?page=bridalteamadmin_editmedia&id=" + media.id }>Review</a>
                                            </td> :
                                            <td>
                                                No Thumbnail<br/>
                                                <a href={"admin.php?page=bridalteamadmin_editmedia&id=" + media.id }>Review</a>
                                            </td>
                                        }
                                        
                                        <td>{this.isMediaApproved(media.approved)}</td>
                                        <td>{media.vendor.businessname}</td>
                                        <td>{media.media.type}</td>                                        
                                        <td>{media.media.keyword}</td>
                                        <td>{media.media.updated_at}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}