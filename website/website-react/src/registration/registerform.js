import React, {Component} from 'react';
import Api from '../api';
import LoadingOverlay from '../misc/loading';

import states from '../misc/states';
import countries from '../misc/countries';

import querystring from 'query-string';

import validatejs from 'validate.js';

export default class RegistrationForm extends Component{
    constructor(props){
        super(props);
        this.api = new Api();

        let stateKeys = Object.keys(states);
        this.stateoptions = [];
        this.stateoptions.push({
            value: "",
            label: "Select a State"
        });

        stateKeys.forEach((abbr, index) => {
            this.stateoptions.push({
                value: abbr,
                label: states[abbr]
            })
        });

        let countryKeys = Object.keys(countries);
        this.countryoptions = [];
        this.countryoptions.push({
            value: "",
            label: "Select a Country"
        });

        countryKeys.forEach((abbr, index) => {
            this.countryoptions.push({
                value: abbr,
                label: countries[abbr]
            })
        });

        this.budgetlevels = [];
        this.budgetlevels.push({
            value: "",
            label: "Select"
        });

        for(var i = 0; i <= 20; i++){
            this.budgetlevels.push({
                value: (i * 500),
                label: "$" + (i * 500)
            });
        }       

        const parsed = querystring.parse(location.search);
        
        var claimid = null;
        if(parsed.claim !== undefined && parsed.claim != ""){
            claimid = parsed.claim
        } 

        this.state = {
            isLoading: false,
            formComplete: false,
            form: {
                claim: claimid
            },
            invalidfields: [],
            categories: [],
            regions: [],
            searchregions: []
        }

        //Get vendor categories
        this.api.get("vendors/categories").then((data) => {            
            var categoryoptions = [];
            categoryoptions.push({
                value: "",
                label: "Select a Category"
            });
            data.categories.forEach((category, index) => {
                categoryoptions.push({
                    value: category.id,
                    label: category.name
                });
            });

            this.setState({
                categories: categoryoptions
            });
        });

        //Get vendor regions
        this.api.get("vendors/regions").then((data) => {            
            var regions = [];
            regions.push({
                value: "",
                label: "Select a Region"
            });
            
            var searchregions = [];
            searchregions.push({
                value: "",
                label: "Select a Search Region"
            });

            data.regions.forEach((region) => {
                regions.push({
                    value: region.id,
                    label: region.region
                })
            });

            this.setState({
                regions: regions,
                searchregions: searchregions
            });
        });

        this.constraints = {
            "pfirstname": {presence: true},
            "plastname": {presence: true},
            "pcontactemail": {
                presence: true,
                email: true
            },
            "pcontactphone": {
                presence: true,
                format:{pattern: "\\d{10}"}
            },
            "ofirstname": {presence: true},
            "olastname": {presence: true},
            "ocontactemail": {
                presence: true,
                email: true
            },
            "ocontactphone": {
                presence: true,
                format:{pattern: "\\d{10}"}
            },
            "address1": {presence: true},
            "city": {presence: true},
            "state": {presence: true},
            "zip": {
                presence: true,
                format:{pattern: "\\d{5}"}
            },
            "businessname": {presence: true},
            "country": {presence: true},
            "category": {presence: true},
            "budgetfrom": {presence: true},
            "budgetto": {presence: true},
            "region": {presence: true},            
            "websiteurl": {presence: true},
            "password": {presence: true},
            "passwordconfirm": {
                presence: true,
                equality: {
                    attribute: "password",
                    message: "^The passwords do not match."
                }
            }            
        }
    }

    handleFieldChange = (event) => {
        var state = this.state;
        
        if(event.target.type == "checkbox"){
            state.form[event.target.name] = event.target.checked;
        }else{
            state.form[event.target.name] = event.target.value;
        }
        
        this.setState(state);
    }

    onSelectChange = (event) => {
        var state = this.state;
        state.form[event.target.name] = event.target.value;
        this.setState(state);
    }

    copyContactInfo = () => {        
        var state = this.state;
        state.form.ofirstname = state.form.pfirstname;
        state.form.olastname = state.form.plastname;
        state.form.ocontactemail = state.form.pcontactemail;
        state.form.ocontactphone = state.form.pcontactphone
        state.form.ocontactphoneext = state.form.pcontactphoneext
        this.setState(state);
    }

    submitRegistration = () => {
        
        var state = this.state;        
        var errors = validatejs(state.form, this.constraints);
        if(errors !== undefined){
            var fieldkeys = Object.keys(errors);
            state.invalidfields = fieldkeys;
            this.setState(state);
            return;
        }

        if(state.form.termsAgree){
            console.log(state.form);
            //Submit via ajax to api
            state.isLoading = true;
            this.setState(state);
            this.api.post("vendors/register", state.form).then((data) => {
                state.isLoading = false;
                if(data.status == "OK"){
                    state.formComplete = true;
                    jQuery('html, body').animate({scrollTop : 0},800);
                }else{
                    alert("Registration Error: " + data.message);
                }        
                this.setState(state);
            }).catch((err) => {
                state.isLoading = false;
                this.setState(state);
                alert("Registration Error: There was a problem during registration.");
            });
        }else{
            alert("You must agree to our terms of service before registering.");
        }        
    }

    render(){
        return (
            <div className="innerwrapper">
                { !this.state.formComplete ?
                <form className="form">
                    {this.state.form.claim == null ?
                        <h1>Begin your Vendor Registration Below:</h1> :
                        <h1>Begin your Vendor Profile Claim Process Below:</h1>
                    }
                    <div className="formsection">
                        <h3>Business <span>Information</span></h3>
                        
                        <div className="row columns">
                            <div className="four columns column col-xs-12 col-sm-4">
                                <label className="form-label">Primary Contact First Name <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pfirstname} name="pfirstname" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="pfirstname" />
                            </div>
                            <div className="four columns column col-xs-12 col-sm-4">
                                <label className="form-label">Primary Contact Last Name <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.plastname} name="plastname" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="pfirstname" />
                            </div>
                            <div className="four columns column col-xs-12 col-sm-4">
                                <label className="form-label">Primary Contact Email <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcontactemail} name="pcontactemail" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="pcontactemail" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="six columns column col-xs-12 col-sm-6">
                                <label className="form-label">Primary Contact Telephone <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcontactphone} name="pcontactphone" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="pcontactphone" />
                            </div>
                            <div className="six columns column col-xs-12 col-sm-6">
                                <label className="form-label">Primary Contact Telephone Extension</label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcontactphoneext} name="pcontactphoneext" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="pcontactphoneext" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <a className="link" onClick={this.copyContactInfo}>Copy from above</a>
                                <br/>
                                <br/>
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="four columns column col-xs-12 col-sm-4">
                                <label className="form-label">Business Owner First Name <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ofirstname} name="ofirstname" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="ofirstname" />
                            </div>
                            <div className="four columns column col-xs-12 col-sm-4">
                                <label className="form-label">Business Owner Last Name <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.olastname} name="olastname" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="olastname" />
                            </div>
                            <div className="four columns column col-xs-12 col-sm-4">
                                <label className="form-label">Business Owner Email <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ocontactemail} name="ocontactemail" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="ocontactemail" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="six columns column col-xs-12 col-sm-6">
                                <label className="form-label">Business Owner Telephone <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ocontactphone} name="ocontactphone" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="ocontactphone" />
                            </div>
                            <div className="six columns column col-xs-12 col-sm-6">
                                <label className="form-label">Business Owner Telephone Extension</label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ocontactphoneext} name="ocontactphoneext" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="ocontactphoneext" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <label className="form-label">Street Address <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.address1} name="address1" type="text" />
                                <br/><br/>
                                <ErrorSpan invalidfields={this.state.invalidfields} for="address1" />
                                <input className="form-input" placeholder="e.x. Apartment B" onChange={this.handleFieldChange} value={this.state.form.address2} name="address2" type="text" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="three columns column col-xs-12 col-sm-3">
                                <label className="form-label">City</label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.city} name="city" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="city" />
                            </div>
                            <div className="three columns column col-xs-12 col-sm-3">
                                <label className="form-label">State</label>                                    
                                <Select name="state" value={this.state.form.state} options={this.stateoptions} onChange={this.onSelectChange}  />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="state" />
                            </div>
                            <div className="three columns column col-xs-12 col-sm-3">
                                <label className="form-label">Zipcode</label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.zip} name="zip" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="zip" />
                            </div>
                            <div className="three columns column col-xs-12 col-sm-3">
                                <label className="form-label">Country</label>
                                <Select name="country" value={this.state.form.country} options={this.countryoptions} onChange={this.onSelectChange}  />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="country" />
                            </div>
                        </div>
                        
                    </div>
                    <div className="formsection">
                        <h3>About Your <span>Business</span></h3>
                        <div className="row columns">
                            <div className="six columns column col-xs-12 col-sm-12">
                                <label className="form-label">Business Name <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.businessname} name="businessname" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="businessname" />
                            </div>
                            <div className="three columns column col-xs-12 col-sm-1">
                                <label className="form-label">Business Category</label>
                                <Select name="category" value={this.state.form.category} options={this.state.categories} onChange={this.onSelectChange} />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="category" />
                            </div>
                            <div className="three columns column col-xs-12 col-sm-1">
                                <label className="form-label">Secondary Category</label>
                                <Select name="secondarycategory" value={this.state.form.secondcategory} options={this.state.categories} onChange={this.onSelectChange} />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="secondcategory" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="six columns column col-xs-12 col-sm-6">
                                <label className="form-label">Budget From <span>*</span></label>
                                <Select name="budgetfrom" value={this.state.form.budgetfrom} options={this.budgetlevels} onChange={this.onSelectChange} />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="budgetfrom" />
                            </div>
                            <div className="six columns column col-xs-12 col-sm-6">
                                <label className="form-label">Budget To <span>*</span></label>
                                <Select name="budgetto" value={this.state.form.budgetto} options={this.budgetlevels} onChange={this.onSelectChange} />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="budgetto" />
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <div className="form-group">
                                    <label className="form-switch">
                                    <input type="checkbox" name="isNational" checked={this.state.isNational} onChange={this.handleFieldChange} /> 
                                    <i className="form-icon"></i> We are a National Business
                                    </label>
                                </div>  
                                
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <label>Region <span>*</span></label>
                                <Select name="region" value={this.state.form.region} options={this.state.regions} onChange={this.onSelectChange} />                            
                                <ErrorSpan invalidfields={this.state.invalidfields} for="region" />
                            </div>
                        </div>                       
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <label className="form-label">Website Url <span>*</span></label>
                                <input placeholder="http://" className="form-input" onChange={this.handleFieldChange} value={this.state.form.websiteurl} name="websiteurl" type="text" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="websiteurl" />
                            </div>
                        </div>  
                    </div>
                    <div className="formsection" id="termsagreement">
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pulvinar dui vel mi eleifend porta. Ut eu dui nec lorem venenatis pharetra. Vestibulum mauris tellus, laoreet at lorem id, pretium fringilla nunc. Vivamus magna nisi, feugiat id condimentum in, lacinia eu lacus. Vestibulum dignissim neque nec ligula venenatis aliquam convallis vitae massa. Nunc fringilla feugiat odio.</p>
                            </div>
                        </div>
                        <div className="row columns">
                            <div className="twelve columns column col-xs-12 col-sm-12">
                                <div className="form-group">
                                    <label className="form-switch">
                                    <input type="checkbox" name="termsAgree" checked={this.state.termsAgree} onChange={this.handleFieldChange} /> 
                                    <i className="form-icon"></i> I Agree
                                    </label>
                                </div>                                
                            </div>
                        </div>
                        <div className="row">
                            <div className="twelve columns">
                                <label className="form-label">Your Account Password <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.password} name="password" type="password" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="password" />
                            </div>
                            <div className="twelve columns">
                                <label className="form-label">Confirm Your Account Password <span>*</span></label>
                                <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.passwordconfirm} name="passwordconfirm" type="password" />
                                <ErrorSpan invalidfields={this.state.invalidfields} for="passwordconfirm" />
                            </div>
                        </div>
                        <a id="btn_submit" onClick={this.submitRegistration} className="btn block">Open my free account</a>
                        { this.state.isLoading ? <LoadingOverlay /> : null }                    
                    </div>
                </form> : null
                }
                { this.state.formComplete ? 
                <div className="formsuccess">
                    <div className="empty">
                        <div className="empty-icon">
                            <i className="icon icon-people"></i>
                        </div>
                        <h4 className="empty-title">You've successfully signed up</h4>
                        <p className="empty-subtitle">Please verify your email address to complete registration.</p>                        
                    </div>
                    
                </div> : null
                }
            </div>
        );
    }
}

var Select = (props) => {    
    return (
        <select name={props.name} value={props.value} onChange={props.onChange} className="form-select">
            {props.options.map((val, index) => {
                return (
                    <option key={index} value={val.value}>{val.label}</option>
                );
            })}

        </select>
    )
}

class ErrorSpan extends Component{    
    render(){        
        if(this.props.invalidfields.indexOf(this.props.for) != -1){
            return (
                <p className="form-input-hint">Required</p>
            )
        }else{
            return null
        }        
    }
}