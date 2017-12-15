import React from 'react';
import querystring from 'query-string';
import Api from './api';
import datefns from 'date-fns';

export default class ReviewVendorClaim extends React.Component{
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
            claim: {},
            originalprofile: {},
            categories: [],
            regions: []
        }
    }

    componentDidMount(){
        this.getClaim();
    }

    getClaim = () => {
        this.api.get('claims/' + this.state.id).then((res) => {
            this.setState({
                claim: res.claim,
                originalprofile: res.origvendor,
                categories: res.categories,
                regions: res.regions
            })
        });
    }

    approveClaim = () => {
        if(confirm("Are you sure you want to appprove this profile claim?")){
            this.api.post('claims/' + this.state.id + '/approve', {}).then((res) => {
                if(res.status == "OK"){
                    alert("Vendor claim has been approved.  The Vendor will be contacted to complete the registration process.");
                    window.location = "/wp-admin/admin.php?page=bridalteamadmin_vendors";
                }else{
                    alert(res.message);
                }
            });
        }
    }

    render(){
        return (
            <div id="bridalteam_admin">
                <div id="poststuff">
                    <div id="post-body" className="metabox-holder columns-2">
                        <div id="post-body-content">
                            <div style={{width: "60%", float: "left"}}>
                                <table className="form-table">
                                    <tbody>
                                        <tr>
                                            <td colSpan="4"><h1>Primary Contact</h1><hr/></td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <label><strong>Primary Contact First Name</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.pcfirstname} className="large-text" name="pcfirstname"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Primary Contact Last Name</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.pclastname} className="large-text" name="pclastname"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Primary Contact Email</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.pcemail} className="large-text" name="pcemail"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="2">
                                                <label><strong>Primary Contact Telephone</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.pcphone} className="large-text" name="pcphone"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Primary Contact Telephone Ext.</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.pcphoneext} className="large-text" name="pcphoneext"  type='text' placeholder="" />
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
                                                <input onChange={this.handleInputChange} value={this.state.claim.ownerfirstname} className="large-text" name="ownerfirstname"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Business Contact Last Name</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.ownerlastname} className="large-text" name="ownerlastname"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Business Contact Email</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.owneremail} className="large-text" name="owneremail"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="2">
                                                <label><strong>Business Contact Telephone</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.ownerphone} className="large-text" name="ownerphone"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Business Contact Telephone Ext.</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.ownerphoneext} className="large-text" name="ownerphoneext"  type='text' placeholder="" />
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
                                                <input onChange={this.handleInputChange} value={this.state.claim.address} className="large-text" name="address"  type='text' placeholder="" /><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.address2} className="large-text" name="address2"  type='text' placeholder="" />
                                            </td>                                        
                                        </tr>
                                        <tr>
                                            <td>
                                                <label><strong>City</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.city} className="large-text" name="city"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>State</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.state} className="large-text" name="state"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Zipcode</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.zip} className="large-text" name="zip"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Country</strong></label><br/>
                                                <input onChange={this.handleInputChange} value={this.state.claim.country} className="large-text" name="country"  type='text' placeholder="" />
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
                                                <input onChange={this.handleInputChange} value={this.state.claim.businessname} className="large-text" name="businessname"  type='text' placeholder="" />
                                            </td>
                                            <td>
                                                <label><strong>Business Category</strong></label><br/>
                                                <select onChange={this.handleInputChange} style={{width: "100%"}} name="category" value={this.state.claim.category}>
                                                    <option value="">Select a Category</option> 
                                                    {this.state.categories.map((cat, index) => {
                                                        return (
                                                            <option key={index} value={cat.id}>{cat.name}</option>
                                                        )
                                                    })}
                                                </select>                                            
                                            </td>
                                            <td>
                                                <label><strong>Secondary Category</strong></label><br/>
                                                <select onChange={this.handleInputChange} style={{width: "100%"}} name="secondarycategory" value={this.state.claim.secondarycategory}>
                                                    <option value="">Select a Category</option>
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
                                                <select onChange={this.handleInputChange} style={{width: "100%"}} name="minbudget" value={this.state.claim.minbudget}>
                                                    {this.budgetlevels.map((level, index) => {
                                                        return (
                                                            <option key={index} value={level.value}>{level.label}</option>
                                                        )
                                                    })}
                                                </select>                                            
                                            </td>
                                            <td>
                                                <label><strong>Budget To</strong></label><br/>
                                                <select onChange={this.handleInputChange} style={{width: "100%"}} name="maxbudget" value={this.state.claim.maxbudget}>
                                                    {this.budgetlevels.map((level, index) => {
                                                        return (
                                                            <option key={index} value={level.value}>{level.label}</option>
                                                        )
                                                    })}
                                                </select>                                            
                                            </td>     
                                            <td>
                                                <label><strong>Region</strong></label><br/>
                                                <select onChange={this.handleInputChange} style={{width: "100%"}} name="region" value={this.state.claim.region}>
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
                                                <input onChange={this.handleInputChange} value={this.state.claim.url} className="large-text" name="url"  type='text' placeholder="" />
                                            </td>                                        
                                        </tr>                                    
                                        <tr>
                                            <td colSpan="4">
                                                <input onClick={this.approveClaim} name="save" type="submit" className="button button-primary button-large" value="Approve Claim" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>        
                            </div>        
                            <div style={{width: "39%", float: "right"}}>
                                <table className="form-table">
                                    <tbody>
                                        <tr>
                                            <td colSpan="2"><h1>Claimed Vendor Profile</h1><hr/></td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Primary Contact First Name</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.pcfirstname} className="large-text" name="pcfirstname"  type='text' placeholder="" />
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Primary Contact Last Name</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.pclastname} className="large-text" name="pclastname"  type='text' placeholder="" />
                                            </td>                                            
                                        </tr>
                                        <tr>
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Primary Contact Email</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.pcemail} className="large-text" name="pcemail"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Primary Contact Telephone</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.pcphone} className="large-text" name="pcphone"  type='text' placeholder="" />
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Primary Contact Telephone Ext.</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.pcphoneext} className="large-text" name="pcphoneext"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="form-table">
                                    <tbody>
                                        <tr>
                                            <td colSpan="2"><hr/></td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Business Contact First Name</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.ownerfirstname} className="large-text" name="ownerfirstname"  type='text' placeholder="" />
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Business Contact Last Name</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.ownerlastname} className="large-text" name="ownerlastname"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Business Contact Email</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.owneremail} className="large-text" name="owneremail"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Business Contact Telephone</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.ownerphone} className="large-text" name="ownerphone"  type='text' placeholder="" />
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Business Contact Telephone Ext.</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.ownerphoneext} className="large-text" name="ownerphoneext"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="form-table">
                                    <tbody>
                                        <tr>
                                            <td colSpan="4"><hr/></td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "100%"}} colSpan="2">
                                                <label><strong>Street Address</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.address} className="large-text" name="address"  type='text' placeholder="" /><br/>
                                                <input disabled value={this.state.originalprofile.address2} className="large-text" name="address2"  type='text' placeholder="" />
                                            </td>                                        
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>City</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.city} className="large-text" name="city"  type='text' placeholder="" />
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>State</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.state} className="large-text" name="state"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Zipcode</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.zip} className="large-text" name="zip"  type='text' placeholder="" />
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Country</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.country} className="large-text" name="country"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table className="form-table">
                                    <tbody>
                                        <tr>
                                            <td colSpan="2"><hr/></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Business Name</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.businessname} className="large-text" name="businessname"  type='text' placeholder="" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Business Category</strong></label><br/>
                                                <select disabled style={{width: "100%"}} name="category" value={this.state.originalprofile.category}>
                                                    <option>No Category Selected</option>
                                                    {this.state.categories.map((cat, index) => {
                                                        return (
                                                            <option key={index} value={cat.id}>{cat.name}</option>
                                                        )
                                                    })}
                                                </select>                                            
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Secondary Category</strong></label><br/>
                                                <select disabled style={{width: "100%"}} name="secondarycategory" value={this.state.originalprofile.secondarycategory}>
                                                    <option>No Category Selected</option>
                                                    {this.state.categories.map((cat, index) => {
                                                        return (
                                                            <option key={index} value={cat.id}>{cat.name}</option>
                                                        )
                                                    })}
                                                </select> 
                                            </td>                                      
                                        </tr>
                                        <tr>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Budget From</strong></label><br/>
                                                <select disabled style={{width: "100%"}} name="minbudget" value={this.state.originalprofile.minbudget}>
                                                <option>No Minimum Budget Selected</option>
                                                    {this.budgetlevels.map((level, index) => {
                                                        return (
                                                            <option key={index} value={level.value}>{level.label}</option>
                                                        )
                                                    })}
                                                </select>                                            
                                            </td>
                                            <td style={{width: "50%"}}>
                                                <label><strong>Budget To</strong></label><br/>
                                                <select disabled style={{width: "100%"}} name="maxbudget" value={this.state.originalprofile.maxbudget}>
                                                    <option>No Maximum Budget Selected</option>
                                                    {this.budgetlevels.map((level, index) => {
                                                        return (
                                                            <option key={index} value={level.value}>{level.label}</option>
                                                        )
                                                    })}
                                                </select>                                            
                                            </td>   
                                        </tr>
                                        <tr>  
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Region</strong></label><br/>
                                                <select disabled style={{width: "100%"}} name="region" value={this.state.originalprofile.region}>
                                                    <option>No Region</option>
                                                    {this.state.regions.map((region, index) => {
                                                        return (
                                                            <option key={index} value={region.id}>{region.region}</option>
                                                        )
                                                    })}
                                                </select> 
                                            </td>                                     
                                        </tr>
                                        <tr>
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Website</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.url} className="large-text" name="url"  type='text' placeholder="" />
                                            </td>                                        
                                        </tr>       
                                        <tr>
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Source</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.source} className="large-text" name="url"  type='text' placeholder="" />
                                            </td>                                        
                                        </tr>                                 
                                        <tr>
                                            <td colSpan="2" style={{width: "100%"}}>
                                                <label><strong>Type</strong></label><br/>
                                                <input disabled value={this.state.originalprofile.type} className="large-text" name="url"  type='text' placeholder="" />
                                            </td>                                        
                                        </tr>
                                    </tbody>
                                </table>
                            </div>            
                        </div>                        
                    </div>
                </div>
            </div>
        )
    }
}