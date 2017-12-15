import React from 'react';
import Api from './api';

export default class VendorManagement extends React.Component{
    constructor(props){
        super(props);

        this.api = new Api();
        this.state = {
            selectedtab: 1,
            tabs: [
                {
                    name: "Vendors",
                    index: 1
                },{
                    name: "Claims",
                    index: 2
                }
            ],
            vendors: [],
            claims: []
        }
    }

    onTabSelect = (index) => {
        this.setState({
            selectedtab: index
        });
    }

    componentDidMount(){
        this.getVendors();
    }

    getVendors = () => {
        this.api.get('vendors').then((res) => {
            console.log(res);
            this.setState({
                vendors: res.vendors,
                claims: res.claims
            });
        });
    }

    render(){
        return(
            <div id="bridalteam_admin">
                <h2 className="nav-tab-wrapper wp-clearfix">
                    {this.state.tabs.map((tab, index) => {
                        var classes = "nav-tab";
                        if(this.state.selectedtab == tab.index){
                            classes += " nav-tab-active";
                        }
                        return(
                            <a key={index} onClick={() => {this.onTabSelect(tab.index)}} className={classes}>{tab.name}</a>
                        )
                    })}                                
                </h2>
                {this.state.selectedtab == 1 ? <VendorList endpoint={this.api.apiendpoint} vendors={this.state.vendors} /> : null}
                {this.state.selectedtab == 2 ? <ClaimsList claims={this.state.claims} /> : null}
            </div>
            
        )
    }
}

class ClaimsList extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div id="bridalteam_admin_vendors" style={{marginTop: "30px"}}>
                <table className="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td width="5%">ID</td>
                            <td width="10%">Business Name</td>
                            <td width="5%">First Name</td>
                            <td width="5%">Last Name</td>
                            <td width="10%">Email</td>
                            <td width="10%">Phone</td>
                            <td width="5%">State</td>  
                            <td width="10%">Submitted On</td>                                         
                        </tr>
                    </thead>
                    <tbody>
                    {this.props.claims.map((vendor, index) => {
                        return (
                            <tr key={index}>
                                <td>{vendor.id}</td>
                                <td>{vendor.businessname}<br/>
                                    <a href={"admin.php?page=bridalteamadmin_reviewclaim&id=" + vendor.id }>Review</a>
                                </td>
                                <td>{vendor.pcfirstname}</td>
                                <td>{vendor.pclastname}</td>
                                <td>{vendor.pcemail}</td>
                                <td>{vendor.pcphone}</td>
                                <td>{vendor.state}</td>
                                <td>{vendor.created_at}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
}

class VendorList extends React.Component{
    constructor(props){
        super(props);


    }

    render(){
        return(
            <div id="bridalteam_admin_vendors" style={{marginTop: "30px"}}>
                <table className="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <td width="5%">ID</td>
                            <td width="10%">Business Name</td>
                            <td width="5%">First Name</td>
                            <td width="5%">Last Name</td>
                            <td width="10%">Email</td>                            
                            <td width="10%">State</td>
                            <td width="5%">Status</td>                                           
                        </tr>
                    </thead>
                    <tbody>
                    {this.props.vendors.map((vendor, index) => {
                        return (
                            <tr key={index}>
                                <td>{vendor.id}</td>
                                <td>{vendor.businessname}<br/>
                                    {vendor.user_id != null ? 
                                        <span><a href={"admin.php?page=bridalteamadmin_editvendor&id=" + vendor.id }>Edit</a> | <a target="_blank" href={this.props.endpoint + "/vendor/" + vendor.slug}>View</a></span> :
                                        <span>Unclaimed Profile</span>
                                    }
                                </td>
                                <td>{vendor.pcfirstname}</td>
                                <td>{vendor.pclastname}</td>
                                <td>{vendor.pcemail}</td>                                
                                <td>{vendor.state}</td>
                                <td>{vendor.approved ? <span><strong>Approved</strong></span> : <span style={{color: "red"}}>Not Approved</span>}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
}