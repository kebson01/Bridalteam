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
                {this.state.selectedtab == 1 ? <VendorList vendors={this.state.vendors} /> : null}


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
                            <td width="10%">Phone</td>
                            <td width="10%">State</td>                                           
                        </tr>
                    </thead>
                    <tbody>
                    {this.props.vendors.map((vendor, index) => {
                        return (
                            <tr key={index}>
                                <td>{vendor.id}</td>
                                <td>{vendor.businessname}<br/>
                                    <a href={"admin.php?page=bridalteamadmin_editvendor&id=" + vendor.id }>Edit</a> | <a>View</a>
                                </td>
                                <td>{vendor.pcfirstname}</td>
                                <td>{vendor.pclastname}</td>
                                <td>{vendor.pcemail}</td>
                                <td>{vendor.pcphone}</td>
                                <td>{vendor.state}</td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
}