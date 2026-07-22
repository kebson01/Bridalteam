import React, {Component} from 'react';
import validatejs from 'validate.js';
import states from '../misc/states';
import countries from '../misc/countries';

import CatQuestions from '../misc/categoryquestions';
import MediaManager from '../misc/mediamanager';
import SubscriptionManager from '../misc/subscriptions';
import VendorAccountMessages from './vendormessages';
import RefundPolicy from '../misc/refundterms';

import Api from '../api';

export default class VendorAccountTabs extends Component {
    constructor(props){
        super(props);

        let stateKeys = Object.keys(states);
        var stateoptions = [];

        stateKeys.forEach((abbr, index) => {
            stateoptions.push({
                value: abbr,
                label: states[abbr]
            })
        });

        let countryKeys = Object.keys(countries);
        var countryoptions = [];

        countryKeys.forEach((abbr, index) => {
            countryoptions.push({
                value: abbr,
                label: countries[abbr]
            })
        });

        var budgetlevels = [];
        for(var i = 0; i <= 20; i++){
            budgetlevels.push({
                value: (i * 500).toFixed(2),
                label: "$" + (i * 500)
            });
        }

        this.api = new Api();

        var categoryquestions = JSON.parse(vendordata.categoryquestions);
        console.log(categoryquestions.subcat);
        //convert back to array
        
        Object.keys(categoryquestions.cat).forEach((key) => {  
            var newarray = [];          
            Object.keys(categoryquestions.cat[key]).forEach((subkey) => {                
                newarray.push(categoryquestions.cat[key][subkey]);
            });
            categoryquestions.cat[key] = newarray;
        });

        Object.keys(categoryquestions.subcat).forEach((key) => {  
            var newarray = [];          
            Object.keys(categoryquestions.subcat[key]).forEach((subkey) => {                
                newarray.push(categoryquestions.subcat[key][subkey]);
            });
            categoryquestions.subcat[key] = newarray;
        });

        var faq = null;
        if(vendordata.faq == null){            
            faq = [];            
        }else{
            faq = JSON.parse(vendordata.faq);
        }

        vendordata.faq = faq;
        
        if(vendordata.about == null){
            vendordata.about = "";            
        }

        if(vendordata.motto == null){
            vendordata.motto = "";            
        }

        if(vendordata.services == null){
            vendordata.services = "";            
        }

        if(primaryquestions[0] != undefined){            
            primaryquestions = JSON.parse(primaryquestions[0].questions);            
        }else{
            primaryquestions = [];
        }

        if(secondaryquestions[0] != undefined){
            secondaryquestions = JSON.parse(secondaryquestions[0].questions);
        }else{
            secondaryquestions = [];
        }

        this.state = {
            tab: 1,
            invalidfields: [],
            form: vendordata,
            stateoptions: stateoptions,
            countryoptions: countryoptions,
            categories: [],
            budgetlevels: budgetlevels,
            questions: primaryquestions,
            secondquestions: secondaryquestions,
            catanswers: categoryquestions.cat,
            secondcatanswers: categoryquestions.subcat,
            regions: [],
            searchregions: [],
            currentsub: {}
        }
    }

    componentDidMount(){
        //Get vendor categories
        this.api.get("vendors/categories").then((data) => {            
            var categoryoptions = [];
            data.categories.forEach((category, index) => {
                categoryoptions.push({
                    value: category.id,
                    label: category.name
                });
            });
            
            var state = this.state;
            state.categories = categoryoptions;
            this.setState(state);
        });

        //Get vendor regions
        this.api.get("vendors/regions").then((data) => {
            var regions = [];
            var searchregions = [];

            data.regions.forEach((region) => {
                regions.push({
                    value: region.id,
                    label: region.region
                })
            });

            data.searchregions.forEach((region) => {
                searchregions.push({
                    value: region.id,
                    label: region.region
                })
            });
            var state = this.state
            state.regions = regions;
            state.searchregions = searchregions;            
            this.setState(state);
        });

        this.api.get('vendors/me/subscriptions').then((d) => {
            console.log(d);
            this.setState({
                currentsub: d.currentsub
            });
        });
    }

    changeTab = (index) => {
        var state = this.state;
        state.tab = index;
        this.setState(state);
    }

    addFaq = () => {
        var state = this.state;
        state.form.faq.push({
            question: "",
            answer: ""
        });
        this.setState(state);
    }

    saveVendor = () => {
        var state = this.state;
        
        state.form.faq = JSON.stringify(state.form.faq);
        this.api.post("vendors/me", this.state.form).then((response) => {
            alert("Account saved.");
        })
    }

    updateFaq = (index, val, field) => {
        var state = this.state;
        state.form.faq[index][field] = val;
        this.setState(state);
    }

    handleFieldChange = (event) => {
        var state = this.state;
        state.form[event.target.name] = event.target.value;
        this.setState(state);
    }

    handleCatAnswersChange = (newVal, question) => {
        var state = this.state;
        state.catanswers['catquestion_' + question] = newVal;
        this.setState(state);
    }

    deactivateAccount = () => {
        var confirmation = confirm(
            "Deactivate your account?\n\n" +
            "Your public listing will be hidden and your subscription will not renew. " +
            "Payments already made for the current billing cycle are non-refundable.\n\n" +
            "You can reactivate your account at any time by logging back in."
        );
        if(confirmation){
            this.api.post("vendors/" + this.state.form.id + "/deactivateaccount", null).then((res) => {
                if(res.status == "OK"){
                    alert(res.message ? res.message : "Your account has been deactivated.");
                    window.location.reload();
                }else{
                    alert(res.message ? res.message : "There was an error deactivating your account.  Contact Bridal Team for support.");
                }
            }).catch(() => {
                alert("There was an error deactivating your account.  Contact Bridal Team for support.");
            });
        }
    }

    reactivateAccount = () => {
        this.api.post("vendors/" + this.state.form.id + "/reactivateaccount", null).then((res) => {
            if(res.status == "OK"){
                alert(res.message ? res.message : "Your account has been reactivated.");
                window.location.reload();
            }else{
                alert(res.message ? res.message : "There was an error reactivating your account.  Contact Bridal Team for support.");
            }
        }).catch(() => {
            alert("There was an error reactivating your account.  Contact Bridal Team for support.");
        });
    }

    cancelAccount = () => {
        var confirmation = confirm(
            "Permanently cancel and close your account?\n\n" +
            "This cancels your subscription, removes your public listing and closes your account. " +
            "Payments already made for the current billing cycle are non-refundable and no refund " +
            "will be issued for the remaining time in your current period.\n\n" +
            "This action cannot be undone from your account. Are you sure you want to continue?"
        );
        if(confirmation){
            var secondconfirm = confirm("Please confirm once more: do you want to permanently close your account?");
            if(!secondconfirm){
                return;
            }
            this.api.post("vendors/" + this.state.form.id + "/cancelaccount", null).then((res) => {
                if(res.status == "OK"){
                    alert(res.message ? res.message : "Your account has been canceled and closed.");
                    window.location.href = "/logout";
                }else{
                    alert(res.message ? res.message : "There was an error closing your account.  Contact Bridal Team for support.");
                }
            }).catch(() => {
                alert("There was an error closing your account.  Contact Bridal Team for support.");
            });
        }
    }

    render(){
        return (
            <div id="profile_tabs">
                <ul>
                    <li><a onClick={() => { this.changeTab(1) }}>Profile</a></li>
                    <li><a onClick={() => { this.changeTab(2) }}>Uploads</a></li>
                    <li><a onClick={() => { this.changeTab(3) }}>Purchases</a></li>
                    <li><a onClick={() => { this.changeTab(4) }}>Messages</a></li>
                    <li><a onClick={() => { this.changeTab(5) }}>Account Settings</a></li>
                </ul>
                <div id="mobilewarning">To edit your account, login on a desktop computer or tablet.</div>
                {this.state.tab == 1 ? 
                    <div id="tab_profile"> 
                        <form className="form">
                            <div className="formsection">
                                <h3>Business <span>Information</span></h3>
                                <div className="row columns">
                                    <div className="four columns column col-xs-12 col-sm-4">
                                        <label className="form-label">Primary Contact First Name <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcfirstname} name="pcfirstname" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="pcfirstname" />
                                    </div>
                                    <div className="four columns column col-xs-12 col-sm-4">
                                        <label className="form-label">Primary Contact Last Name <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pclastname} name="pclastname" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="pclastname" />
                                    </div>
                                    <div className="four columns column col-xs-12 col-sm-4">
                                        <label className="form-label">Primary Contact Email <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcemail} name="pcemail" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="pcemail" />
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Primary Contact Telephone <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcphone} name="pcphone" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="pcphone" />
                                    </div>
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Primary Contact Telephone Extension</label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.pcphoneext} name="pcphoneext" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="pcphoneext" />
                                    </div>
                                </div>                                
                                <div className="row columns">
                                    <div className="four columns column col-xs-12 col-sm-4">
                                        <label className="form-label">Business Owner First Name <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ownerfirstname} name="ownerfirstname" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="ownerfirstname" />
                                    </div>
                                    <div className="four columns column col-xs-12 col-sm-4">
                                        <label className="form-label">Business Owner Last Name <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ownerlastname} name="ownerlastname" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="ownerlastname" />
                                    </div>
                                    <div className="four columns column col-xs-12 col-sm-4">
                                        <label className="form-label">Business Owner Email <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.owneremail} name="owneremail" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="owneremail" />
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Business Owner Telephone <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ownerphone} name="ownerphone" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="ownerphone" />
                                    </div>
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Business Owner Telephone Extension</label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.ownerphoneext} name="ownerphoneext" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="ownerphoneext" />
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="twelve columns column col-xs-12 col-sm-12">
                                        <label className="form-label">Street Address <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.address} name="address" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="address" />
                                        <br/><br/>
                                        <input className="form-input" placeholder="e.x. Apartment B" onChange={this.handleFieldChange} value={this.state.form.address2} name="address2" type="text" />
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="three columns column col-xs-12 col-sm-3">
                                        <label className="form-label">City</label>
                                        <input disabled className="form-input" onChange={this.handleFieldChange} value={this.state.form.city} name="city" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="city" />
                                    </div>
                                    <div className="three columns column col-xs-12 col-sm-3">
                                        <label className="form-label">State</label>
                                        <Select disabled name="state" clearable={false} value={this.state.form.state} options={this.state.stateoptions} onChange={this.onStateSelectChange} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="state" />
                                    </div>
                                    <div className="three columns column col-xs-12 col-sm-3">
                                        <label className="form-label">Zipcode</label>
                                        <input disabled className="form-input" onChange={this.handleFieldChange} value={this.state.form.zip} name="zip" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="zip" />
                                    </div>
                                    <div className="three columns column col-xs-12 col-sm-3">
                                        <label className="form-label">Country</label>
                                        <Select disabled name="country" clearable={false} value={this.state.form.country} options={this.state.countryoptions} onChange={this.onStateSelectChange} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="country" />
                                    </div>
                                </div>
                            </div>
                            <a onClick={this.saveVendor} className="btn">Save Profile</a>
                            <div className="formsection">
                                <h3>About Your <span>Business</span></h3>
                                <div className="row columns">
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Business Name <span>*</span></label>
                                        <input className="form-input" onChange={this.handleFieldChange} value={this.state.form.businessname} name="businessname" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="businessname" />
                                    </div>
                                    <div className="three columns column col-xs-12 col-sm-3">
                                        <label className="form-label">Business Category</label>
                                        <Select disabled name="category" value={this.state.form.category} options={this.state.categories} onChange={this.onPrimaryCategoryChange} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="category" />
                                    </div>
                                    <div className="three columns column col-xs-12 col-sm-3">
                                        <label className="form-label">Secondary Category</label>
                                        <Select disabled name="secondarycategory" value={this.state.form.secondarycategory} options={this.state.categories} onChange={this.onSecondaryCategoryChange} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="secondarycategory" />
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Budget From <span>*</span></label>
                                        <Select clearable={false} name="minbudget" value={this.state.form.minbudget} options={this.state.budgetlevels} onChange={(val) => {this.onSelectChange(val.value, "minbudget")}} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="minbudget" />
                                    </div>
                                    <div className="six columns column col-xs-12 col-sm-6">
                                        <label className="form-label">Budget To <span>*</span></label>
                                        <Select clearable={false}  name="maxbudget" value={this.state.form.maxbudget} options={this.state.budgetlevels} onChange={(val) => {this.onSelectChange(val.value, "maxbudget")}} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="maxbudget" />
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="twelve columns column col-xs-12 col-sm-12">
                                        <div className="form-group">
                                            <label className="form-switch">
                                            <input type="checkbox" name="isnational" checked={this.state.form.isnational} onChange={this.handleFieldChange} />
                                            <i className="form-icon"></i> We are a National Business
                                            </label>
                                        </div> 
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="twelve columns column col-xs-12 col-sm-12">
                                        <label className="form-label">Region <span>*</span></label>
                                        <Select clearable={false} name="region" value={this.state.form.region} options={this.state.regions} onChange={(val) => {this.onSelectChange(val.value, "region")}} />                            
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="region" />
                                    </div>
                                </div>                                
                                <div className="row columns">
                                    <div className="twelve columns column col-xs-12 col-sm-12">
                                        <label className="form-label">Website Url <span>*</span></label>
                                        <input placeholder="http://" className="form-input" onChange={this.handleFieldChange} value={this.state.form.url} name="url" type="text" />
                                        <ErrorSpan invalidfields={this.state.invalidfields} for="url" />
                                    </div>
                                </div>  
                                <div className="row columns">
                                    <div className="twelve columns column col-xs-12 col-sm-12">
                                        <label className="form-label">About Us <span>*</span></label>
                                        <textarea className="form-input" value={this.state.form.about} name="about" onChange={this.handleFieldChange}  required=""></textarea>
                                    </div>
                                </div>
                                <div className="row columns">
                                    <div className="twelve columns column col-xs-12 col-sm-12">
                                        <label className="form-label">Services <span>*</span></label>
                                        <textarea className="form-input" value={this.state.form.services} name="services" onChange={this.handleFieldChange} required=""></textarea>
                                    </div>
                                </div>                      
                            </div>
                            <div className="formsection">
                                <h3>Frequently Asked <span>Questions</span></h3>
                                <div className="faqrow">
                                    <div className="row columns">
                                        <div className="twelve columns column col-xs-12 col-sm-12">                                                                                        
                                            <div className="faqs">
                                                {this.state.form.faq.map((faq, index) => {
                                                    return (
                                                        <div key={index} className="faq columns">
                                                            <div className='four columns column col-xs-12 col-sm-4'>
                                                                <label className="form-label">Question </label>
                                                                <input className="form-input" value={faq.question} onChange={(event) => { this.updateFaq(index, event.target.value, "question")}} type='text' />
                                                            </div> 
                                                            <div className='eight columns column col-xs-12 col-sm-8'>
                                                                <label className="form-label">Answer </label>
                                                                <textarea value={faq.answer} onChange={(event) => { this.updateFaq(index, event.target.value, "answer")}} className="form-input"></textarea>
                                                            </div> 
                                                        </div>  
                                                    )
                                                })}                                                                                                  
                                            </div>                                        
                                        </div>                                    
                                    </div>
                                    <a onClick={this.addFaq} className="btn">Add FAQ</a>
                                </div>  
                            </div>
                            <a onClick={this.saveVendor} className="btn">Save Profile</a>
                            <div className="formsection">
                                <h3><span className="categoryname">{this.state.form.categoryname}</span> <span>Information</span></h3>
                                <CatQuestions questions={this.state.questions} catanswers={this.state.catanswers} handleCatAnswersChange={this.handleCatAnswersChange} />                    
                            </div>
                            { this.state.secondquestions.length != 0 ?
                            <div className="formsection">
                                <h3><span className="categoryname">{this.state.form.secondarycategoryname}</span> <span>Information</span></h3>
                                <CatQuestions questions={this.state.secondquestions} catanswers={this.state.secondcatanswers} handleCatAnswersChange={this.handleSecondCatAnswersChange} />                    
                            </div> : null } 
                            
                            <a onClick={this.saveVendor} className="btn">Save Profile</a>
                        </form>
                    </div> : null 
                }
                {this.state.tab == 2 ? 
                    <div id="tab_uploads">
                        <MediaManager />
                    </div> : null
                }
                {this.state.tab == 3 ? 
                    <div id="tab_purchases">
                        <SubscriptionManager isaccount={true} expiration={vendordata.expiration_date} nextsub={nextsub} currentsub={this.state.currentsub} />
                    </div> : null
                } 
                {this.state.tab == 4 ? <VendorAccountMessages /> : null }
                {this.state.tab == 5 ?
                    <div id="tab_accountsettings">
                        <div className="formsection">
                            <RefundPolicy />
                            <p className="policynote">
                                To cancel your subscription while keeping your account open, use the
                                <strong> Cancel Subscription</strong> option on the <strong>Purchases</strong> tab.
                            </p>
                        </div>
                        <div className="formsection accountactions">
                            { this.state.form.active != true ?
                                <div>
                                    <h3>Reactivate <span>Account</span></h3>
                                    <p>
                                        Your account is currently deactivated and your listing is hidden.
                                        Reactivate to make your listing visible again. Note that your
                                        subscription will not renew automatically &mdash; choose a subscription
                                        on the Purchases tab to keep your listing active going forward.
                                    </p>
                                    <a onClick={this.reactivateAccount} className="btn">Reactivate My Account</a>
                                </div>
                            :
                                <div>
                                    <h3>Deactivate <span>Account</span></h3>
                                    <p>
                                        Temporarily hide your public listing and stop your subscription from
                                        renewing. Your account and data are kept, and you can reactivate at any
                                        time. Payments already made for the current billing cycle are
                                        non-refundable.
                                    </p>
                                    <a onClick={this.deactivateAccount} className="btn btn-deactivate">Deactivate My Account</a>
                                </div>
                            }
                        </div>
                        <div className="formsection accountactions danger">
                            <h3>Cancel &amp; Close <span>Account</span></h3>
                            <p>
                                Permanently cancel your subscription and close your account. Your public
                                listing will be removed. This cannot be undone from your account, and
                                payments already made for the current billing cycle are non-refundable.
                            </p>
                            <a onClick={this.cancelAccount} className="btn btn-cancelaccount">Cancel &amp; Close My Account</a>
                        </div>
                    </div> : null
                }
            </div>
        )
    }
}

var Select = (props) => {    
    return (
        <select disabled={props.disabled} multiple={props.multiple} name={props.name} value={props.value} onChange={props.onChange} className="form-select">            
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
                <span className="error">Required</span>
            )
        }else{
            return null
        }        
    }
}