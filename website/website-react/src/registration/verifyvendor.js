import React, {Component} from 'react';
import querystring from 'query-string';
import Api from '../api';

import LoadingOverlay from '../misc/loading';

export default class VerifyVendor extends Component{
    constructor(props){
        super(props);

        this.api = new Api();

        const parsed = querystring.parse(location.search);        

        this.state = {
            isLoading: true,
            verified: false,
            error: ""
        }

        this.api.get("vendors/verify?verification=" + parsed.verification + "&vid=" + parsed.v).then((data) => {
            var state = this.state;
            state.isLoading = false;
            if(data.status == "OK"){
                state.verified = true;    
            }else{
                state.verified = false;
                state.error = data.message;
            }

            this.setState(state);
        });
    }

    render(){
        return(
            <div className="innerwrapper">
                <div id="verification_message">
                    { this.state.isLoading ? <h1>...Verifying Account... <LoadingOverlay/></h1> : null }
                    { this.state.verified ? 
                        <div className="empty">
                            <div className="empty-icon">
                                <i className="icon icon-people"></i>
                            </div>
                            <h4 className="empty-title">Your account has been verified!</h4>
                            <p className="empty-subtitle">You can now login with your credentials. Click the button to login.</p>
                            <div className="empty-action">
                                <button onClick={() => { window.location.href = "/vendor/login"; }} className="btn">Vendor Login</button>
                            </div>
                        </div>
                         : null }                    
                    { !this.state.verified ? <h1>{this.state.error}</h1> : null }                    
                </div>
            </div>
        )
    }
}