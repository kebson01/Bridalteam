import React, {Component} from 'react';
import Api from "../api";
import LoadingOverlay from '../misc/loading';

export default class VendorAccountMessages extends Component{
    constructor(props){
        super(props);
        this.selectMessage = this.selectMessage.bind(this);

        this.api = new Api();

        var state = {
            isLoading: true,
            messages: [],
            selectedMessage: {}
        }        

        this.state = state;
    }

    componentDidMount(){        
        this.api.get('vendors/me/messages').then((data) => {
            console.log(data);
            var state = this.state;
            state.messages = data.messages;
            state.isLoading = false;
            this.setState(state);
        });
    }

    selectMessage(id){
        var state = this.state;        
        state.isLoading = false;
        this.setState(state);

        this.api.get('vendors/me/message/' + id).then((data) => {            
            var state = this.state;
            state.selectedMessage = data.message;  
            state.selectedMessage.message = JSON.parse(state.selectedMessage.messagejson);   
            console.log(state.selectedMessage);
            this.setState(state);

            this.api.get('vendors/me/messages').then((data) => {            
                var state = this.state;
                state.messages = data.messages;
                state.isLoading = false;
                this.setState(state);
            });
            
        });
    }

    render(){
        return(
            <div id="vendorMessageViewer">
                <LoadingOverlay loading={this.state.isLoading} />
                <div id="messageList">
                    <ul>
                        {this.state.messages.map((msg, index) => {
                            if(msg.id == this.state.selectedMessage.id){
                                return(
                                    <li className="selected" onClick={() => { this.selectMessage(msg.id)}} key={index}>
                                        <span className="from"><i className="fa fa-envelope-o" aria-hidden="true"></i>{msg.sender_firstname} {msg.sender_lastname}</span>
                                        <span className="date">On: {msg.created_at}</span>
                                        {msg.unread ? <span className="unread"></span> : null}
                                        
                                    </li>
                                )
                            }else{
                                return(
                                    <li onClick={() => { this.selectMessage(msg.id)}} key={index}>
                                        <span className="from"><i className="fa fa-envelope-o" aria-hidden="true"></i>{msg.sender_firstname} {msg.sender_lastname}</span>
                                        <span className="date">On: {msg.created_at}</span>
                                        {msg.unread ? <span className="unread"></span> : null}
                                        
                                    </li>
                                )
                            }
                            
                        })}
                    </ul>
                    
                </div>
                <div id="messagePane">
                    {this.state.selectedMessage.id !== undefined ?
                        <div id="messageDetail">
                            <div className="row"><strong>From:</strong> {this.state.selectedMessage.message.firstname} {this.state.selectedMessage.message.lastname}
                                {this.state.selectedMessage.senderbride_id != null ? <em> (Registered Bride)</em> : null }
                            </div>
                            <div className="row"><strong>On: </strong> {this.state.selectedMessage.created_at}</div>
                            <div className="row"><strong>Event Type: </strong> {this.state.selectedMessage.message.eventtype}</div>
                            <div className="row"><strong>Event Date: </strong> {this.state.selectedMessage.message.eventdate}</div>
                            <div className="message">{this.state.selectedMessage.message.message}</div>
                        </div>
                     : null
                    }
                    
                </div>
            </div>
        )
    }

}