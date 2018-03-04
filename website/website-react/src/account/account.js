import React, {Component} from 'react';
import VendorAccountTabs from './accounttabs';

import Api from '../api';

export default class VendorAccount extends Component{
    constructor(props){
        super(props)

        this.api = new Api();

        this.state = {
            vendordata: vendordata
        }
    }

    onProfilePhotoChange = (event) => {                        
        var formdata = new FormData();
        var file = event.target.files[0];
        formdata.append("file", file);
        
        this.api.post("vendors/me/logo", formdata).then((data) => {
            if(data.status == "OK"){
                var vendor = this.state.vendordata;
                vendor.logo = data.logopath;

                this.setState({
                    vendordata: vendor
                });                
            }
        });
    }

    onProfileBackgroundChange = (event) => {
        var formdata = new FormData();
        var file = event.target.files[0];
        formdata.append("file", file);
        
        this.api.post("vendors/me/bg", formdata).then((data) => {
            if(data.status == "OK"){
                var vendor = this.state.vendordata;
                vendor.backgroundimage = data.bgpath;

                this.setState({
                    vendordata: vendor
                });                
            }
        });
    }

    render(){
        return (
            <span>
                {vendordata.active != true && vendordata.approved == true?
                    <div className="vendorerrors" style={{
                        padding: "15px",
                        textAlign: "center",
                        backgroundColor: "red",
                        color: "white",
                        fontSize: "1.4em"
                        
                    }}>
                        <div className="innerwrapper">
                            Your Vendor Account has been disabled.<br />Contact support for more details.
                        </div>
                    </div>
                    : null
                }
                <header style={{backgroundImage: "url('/storage/" + this.state.vendordata.backgroundimage + "')"}} className="pageheader">
                    <div id="profile_header">
                        <a id="profile_header_edit_btn"><i className="fa fa-pencil"></i> Edit Background</a>
                        <input onChange={this.onProfileBackgroundChange} id="backgroundfile" type="file" name="backgroundfile" />
                        
                        <div id="profile_logo">
                            {this.state.vendordata.logo != null && this.state.vendordata.logo != "" ? 
                                <img src={"/storage" + this.state.vendordata.logo} />  :
                                <img src="/img/bt_placeholder.jpg" />
                            }
                            <a onClick={this.onProfilePhotoClick} id="profile_logo_edit_btn"><i className="fa fa-pencil"></i> Edit Logo</a>                    
                            <input onChange={this.onProfilePhotoChange} style={{opacity: 0, position: "absolute", bottom: "0px", width: 138, height: 32}} id="logofile" type="file" name="logofile" />
                        </div>
                        <div id="profile_header_info">
                            <h1>{this.state.vendordata.businessname}</h1>
                            <div className="categories">{this.state.vendordata.categoryname}</div>
                            <div className="rating"></div>
                        </div>
                    </div>
                    <span className="overlay"></span>
                </header>
                <div id="pagebody">
                    <div className="innerwrapper">
                        <div className="content">
                            <div id="profile_details">
                                <div id="quickinfo">
                                    <a className="vendorurl" target="_blank" href={this.state.vendordata.url}><i className="fa fa-share"></i> Vendor Website</a>
                                    <a className="vendormobile"><i className="fa fa-mobile"></i> {this.state.vendordata.pcphone}</a>
                                    <hr/>
                                    <div className="detail">    
                                        <i className="fa fa-user"></i>                                
                                        <strong>Contact</strong>
                                        {this.state.vendordata.pcfirstname + " " + this.state.vendordata.pclastname}                                        
                                    </div>
                                    <div className="detail">    
                                        <i className="fa fa-map-marker"></i>                             
                                        <strong>Location</strong>
                                        {this.state.vendordata.address} <br/>
                                        {this.state.vendordata.address2 != null ?
                                            this.state.vendordata.address2 + "\n" : null
                                        }
                                        {this.state.vendordata.city + ", " + this.state.vendordata.state}                                                                         
                                        {" " + vendordata.zip}                                        
                                    </div>  
                                    <div className="detail">    
                                        <i className="fa fa-money"></i>                             
                                        <strong>Budget</strong>
                                        {"$" + this.state.vendordata.minbudget + " - $" + this.state.vendordata.maxbudget}                                        
                                    </div>   
                                    <a target="_blank" href={"/vendor/" + this.state.vendordata.slug} className="button publiclink" >View Public Profile</a>   
                                </div>
                                <VendorAccountTabs />
                            </div>
                        </div>
                    </div>
                </div>
            </span>
        )
    }
}