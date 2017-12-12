import React from 'react';
import querystring from 'query-string';
import Api from './api';
import datefns from 'date-fns';

export default class EditVendor extends React.Component{
    constructor(props){
        super(props);

        var query = querystring.parse(window.location.search);
        this.api = new Api();

        this.budgetlevels = [];
        for(var i = 0; i <= 20; i++){
            this.budgetlevels.push({
                value: (i * 500).toFixed(2).toString(),
                label: "$" + (i * 500)
            });
        }

        this.state = {
            id: query.id,
            vendor: {},
            categories: [],
            regions: [],
            currentsub: null,
            imagecount: 0,
            videocount: 0
        }

        console.log(query);
    }

    componentDidMount(){
        this.getVendor();
    }

    getVendor = () => {
        this.api.get('vendors/' + this.state.id).then((res) => {
            this.setState({
                vendor: res.vendor,
                categories: res.categories,
                regions: res.regions,
                currentsub: res.currentsub
            });
        });
    }

    handleInputChange = (e) => {
        var vendor = this.state.vendor;
        vendor[e.target.name] = e.target.value;
        this.setState({
            vendor: vendor
        });
    }

    saveVendor = () => {        
        this.api.post('vendors/' + this.state.id, this.state.vendor).then((res) => {
            if(res.status == "OK"){
                alert("Vendor saved.");
            }else{
                alert(res.message);
            }
        });
    }

    approveVendor = () => {
        this.api.post('vendors/' + this.state.id + '/approve', {}).then((res) => {
            if(res.status == "OK"){                
                alert("Vendor approved.");
                var vendor = this.state.vendor;
                vendor.approved = true;
                this.setState({
                    vendor: vendor
                })
            }else{
                alert(res.message);
            }
        });
    }

    disableVendor = () => {        
        this.api.post('vendors/' + this.state.id + '/disable', {}).then((res) => {
            if(res.status == "OK"){                
                alert("Vendor disabled.");
                var vendor = this.state.vendor;
                vendor.approved = false;
                vendor.approved_on = null;
                this.setState({
                    vendor: vendor
                })
            }else{
                alert(res.message);
            }
        });
    }

    render(){
        return(
            <div id="bridalteam_admin">
                <div id="poststuff">
                    <div id="post-body" className="metabox-holder columns-2">
                        <div id="post-body-content">
                            <table className="form-table">
                                <tbody>
                                    <tr>
                                        <td colSpan="4"><h1>Primary Contact</h1><hr/></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <label><strong>Primary Contact First Name</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.pcfirstname} className="large-text" name="pcfirstname"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Primary Contact Last Name</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.pclastname} className="large-text" name="pclastname"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Primary Contact Email</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.pcemail} className="large-text" name="pcemail"  type='text' placeholder="" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2">
                                            <label><strong>Primary Contact Telephone</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.pcphone} className="large-text" name="pcphone"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Primary Contact Telephone Ext.</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.pcphoneext} className="large-text" name="pcphoneext"  type='text' placeholder="" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table className="form-table">
                                <tbody>
                                    <tr>
                                        <td colSpan="4"><h1>Business Contact</h1><hr/></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <label><strong>Business Contact First Name</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.ownerfirstname} className="large-text" name="ownerfirstname"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Business Contact Last Name</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.ownerlastname} className="large-text" name="ownerlastname"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Business Contact Email</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.owneremail} className="large-text" name="owneremail"  type='text' placeholder="" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2">
                                            <label><strong>Business Contact Telephone</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.ownerphone} className="large-text" name="ownerphone"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Business Contact Telephone Ext.</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.ownerphoneext} className="large-text" name="ownerphoneext"  type='text' placeholder="" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table className="form-table">
                                <tbody>
                                    <tr>
                                        <td colSpan="4"><h1>Business Address</h1><hr/></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <label><strong>Street Address</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.address} className="large-text" name="address"  type='text' placeholder="" /><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.address2} className="large-text" name="address2"  type='text' placeholder="" />
                                        </td>                                        
                                    </tr>
                                    <tr>
                                        <td>
                                            <label><strong>City</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.city} className="large-text" name="city"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>State</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.state} className="large-text" name="state"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Zipcode</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.zip} className="large-text" name="zip"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Country</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.country} className="large-text" name="country"  type='text' placeholder="" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table className="form-table">
                                <tbody>
                                    <tr>
                                        <td colSpan="4"><h1>Business Information</h1><hr/></td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <label><strong>Business Name</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.businessname} className="large-text" name="businessname"  type='text' placeholder="" />
                                        </td>
                                        <td>
                                            <label><strong>Business Category</strong></label><br/>
                                            <select onChange={this.handleInputChange} style={{width: "100%"}} name="category" value={this.state.vendor.category}>
                                                {this.state.categories.map((cat, index) => {
                                                    return (
                                                        <option key={index} value={cat.id}>{cat.name}</option>
                                                    )
                                                })}
                                            </select>                                            
                                        </td>
                                        <td>
                                            <label><strong>Secondary Category</strong></label><br/>
                                            <select onChange={this.handleInputChange} style={{width: "100%"}} name="secondarycategory" value={this.state.vendor.secondarycategory}>
                                                {this.state.categories.map((cat, index) => {
                                                    return (
                                                        <option key={index} value={cat.id}>{cat.name}</option>
                                                    )
                                                })}
                                            </select> 
                                        </td>                                      
                                    </tr>
                                    <tr>
                                        <td>
                                            <label><strong>Budget From</strong></label><br/>
                                            <select onChange={this.handleInputChange} style={{width: "100%"}} name="minbudget" value={this.state.vendor.minbudget}>
                                                {this.budgetlevels.map((level, index) => {
                                                    return (
                                                        <option key={index} value={level.value}>{level.label}</option>
                                                    )
                                                })}
                                            </select>                                            
                                        </td>
                                        <td>
                                            <label><strong>Budget To</strong></label><br/>
                                            <select onChange={this.handleInputChange} style={{width: "100%"}} name="maxbudget" value={this.state.vendor.maxbudget}>
                                                {this.budgetlevels.map((level, index) => {
                                                    return (
                                                        <option key={index} value={level.value}>{level.label}</option>
                                                    )
                                                })}
                                            </select>                                            
                                        </td>     
                                        <td>
                                            <label><strong>Region</strong></label><br/>
                                            <select onChange={this.handleInputChange} style={{width: "100%"}} name="region" value={this.state.vendor.region}>
                                                {this.state.regions.map((region, index) => {
                                                    return (
                                                        <option key={index} value={region.id}>{region.region}</option>
                                                    )
                                                })}
                                            </select> 
                                        </td>                                     
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <label><strong>Website</strong></label><br/>
                                            <input onChange={this.handleInputChange} value={this.state.vendor.url} className="large-text" name="url"  type='text' placeholder="" />
                                        </td>                                        
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <label><strong>About</strong></label><br/>
                                            <textarea onChange={this.handleInputChange} value={this.state.vendor.about} name="about" cols="80" rows="10" className="large-text"></textarea>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <label><strong>Services</strong></label><br/>
                                            <textarea onChange={this.handleInputChange} value={this.state.vendor.services} name="services" cols="80" rows="10" className="large-text"></textarea>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4">
                                            <input onClick={this.saveVendor} name="save" type="submit" className="button button-primary button-large" value="Save Profile" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                        </div>
                        <div id="postbox-container-1" className="postbox-container">
                            <div className="meta-box-sortables">
                                {this.state.vendor != null ? <VendorStatsModule vendor={this.state.vendor} disableVendor={this.disableVendor} approveVendor={this.approveVendor} /> : null }                                
                                {this.state.currentsub != null ? <VendorSubModule sub={this.state.currentsub} /> : null }
                                {this.state.vendor != null ? <VendorMediaModule images={this.state.imagecount} videos={this.state.videocount} /> : null }                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class VendorSubModule extends React.Component{
    constructor(props){
        super(props);
    }

    render() {
        return (
            <div id="submitdiv" className="postbox">
                <h2><span>Vendor Subscription</span></h2>
                <div className="inside">
                    <div className="submitbox" id="submitpost">
                        <div id="minor-publishing">
                            <div id="misc-publishing-actions">
                                <div className="misc-pub-section">
                                    Subscription:
                                    <span id="post-status-display"> {this.props.sub.name}</span>
                                </div>    
                                <div className="misc-pub-section">
                                    Period:
                                    <span id="post-status-display"> {this.props.sub.duration} month(s)</span>
                                </div>  
                                <div className="misc-pub-section">
                                    Level:
                                    <span id="post-status-display"> {this.props.sub.slug}</span>
                                </div>    
                                <div className="misc-pub-section">
                                    Addons:
                                    <span id="post-status-display">
                                        <ul>
                                        {this.props.sub.addons.map((addon, index) => {
                                            return(
                                                <li key={index}> - {addon.details.name}</li>
                                            )
                                        })}
                                        </ul>
                                    </span>
                                </div>   
                                <div className="misc-pub-section">
                                    Expires:
                                    <span id="post-status-display"> {datefns.format(datefns.parse(this.props.sub.nextrenewal_on.date), "MMM DD, YYYY @ hh:mma")}</span>
                                </div>                           
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class VendorMediaModule extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div id="submitdiv" className="postbox">
                <h2><span>Media Stats</span></h2>
                <div className="inside">
                    <div className="submitbox" id="submitpost">
                        <div id="minor-publishing">
                            <div id="misc-publishing-actions">
                                <div className="misc-pub-section">
                                    Image Count:
                                    <span id="post-status-display"> {this.props.images}</span>
                                </div>   
                                <div className="misc-pub-section">
                                    Video Count:
                                    <span id="post-status-display"> {this.props.videos}</span>
                                </div>  
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class VendorStatsModule extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return(
            <div id="submitdiv" className="postbox">
                <h2><span>Vendor Details</span></h2>
                <div className="inside">
                    <div className="submitbox" id="submitpost">
                        <div id="minor-publishing">
                            <div id="misc-publishing-actions">
                                <div className="misc-pub-section">
                                    Approval:
                                    <span id="post-status-display">
                                        {this.props.vendor.approved ? " Approved" : " Not-Approved"}
                                    </span>
                                </div>
                                <div className="misc-pub-section">
                                    Created At:
                                    <span id="post-status-display"> {datefns.format(datefns.parse(this.props.vendor.created_at), "MMM DD, YYYY @ hh:mma")}</span>
                                </div>
                                <div className="misc-pub-section">
                                    Updated At:
                                    <span id="post-status-display"> {datefns.format(datefns.parse(this.props.vendor.updated_at), "MMM DD, YYYY @ hh:mma")}</span>
                                </div>
                            </div>
                        </div>
                        <div id="major-publishing-actions">
                            <div id="delete-action">
                                <a className="submitdelete deletion">Delete Profile</a>
                            </div>

                            <div id="publishing-action">                                
                                {this.props.vendor.approved ?
                                    <input onClick={this.props.disableVendor} name="save" type="submit" className="button button-primary button-large" value="Disable Profile" /> :
                                    <input onClick={this.props.approveVendor} name="save" type="submit" className="button button-primary button-large" value="Approve Profile" />
                                }                                
                            </div>
                            <div className="clear"></div>
                        </div>
                    </div>                    
                </div>
            </div>
        )
    }
}