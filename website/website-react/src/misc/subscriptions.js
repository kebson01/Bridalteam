import React, {Component} from 'react';
import Api from "../api"
import validatejs from 'validate.js';
import moment from 'moment';

export default class SubscriptionManager extends Component{
    constructor(props){
        super(props);

        this.api = new Api();

        var page = 1;

        if(this.props.isaccount){
            page = 0;
        }
        
        this.state = {
            isValid: false,
            isLoading: false,
            page: page,
            invalidfields: [],
            selectedduration: null,
            selectedsub: null,
            selectedaddons: [],
            allsubs: [],
            alladdons: [],
            vendor: {},
            paymenttotals: {
                subscription: null,
                addons: []
            },
            paymenttotal: 0.00,
            ccn: "",
            nameoncard: "",
            expdate: "",
            cvc: "",
            nextSubStartsOn: null

        };

        this.constraints = {
            "ccn": {presence: true},
            "nameoncard": {presence: true},
            "expdate": {presence: true},
            "cvc": {presence: true},
        };

        this.refreshSubscriptionData();
    }

    nextPage = () =>{
        var state = this.state;
        state.page++;        

        if (state.page == 2) {
            this.calculateSubscriptionTotals();
        }

        this.setState(state);    
    }

    backPage = () => {
        var state = this.state;
        state.page--;        
        this.setState(state);        
    }

    cancelCheckout = () => {
        if(this.props.isaccount){
            this.setState({
                page: 0,
                selectedduration: null,
                selectedsub: null,
                selectedaddons: [],
                paymenttotals: {
                    subscription: null,
                    addons: []
                },
                paymenttotal: 0.00,
                ccn: "",
                nameoncard: "",
                expdate: "",
                cvc: "",
                nextSubStartsOn: null
            });
        }else{
            this.backPage();
        }
    }

    isValidated = () => {        
        return this.state.isValid;
    }

    refreshSubscriptionData = () => {
        this.api.get("vendors/welcome").then((data) => {                
            this.setState({
                allsubs: data.subscriptions,
                alladdons: data.addons,
                vendor: data.vendor
            });
        });
    }

    handleFieldChange = (event) => {
        var state = this.state;
        state[event.target.name] = event.target.value;
        //If duration changes, wipe out all selections
        if(event.target.name == "selectedduration"){
            state.selectedaddons = [];
            state.selectedsub = null;
        }

        //If selected sub changes, calculate price
        if(event.target.name == "selectedsub"){
            if(event.target.value != null){
                var subscription = this.getSubscriptionById(event.target.value);
                state.paymenttotals.subscription = {
                    name: subscription.name,
                    price: subscription.amount,
                    duration: subscription.duration
                };
            }
        }
        this.setState(state);
    }

    handleAddonChange = (e) => {
        var state = this.state;        
        if(e.target.checked){
            console.log(e.target.value);
            state.selectedaddons.push(e.target.value);
        }else{
            var index = state.selectedaddons.indexOf(e.target.value);
            state.selectedaddons.splice(index, 1);
        }

        this.setState({
            selectedaddons: state.selectedaddons
        });
    }

    selectDuration = (val) => {
        var duration = val.target.getAttribute("data-duration");
        console.log(duration);
        this.setState({
            selectedduration: duration,
            selectedsub: null,
            selectedaddons: []
        });        
    }

    selectPackage = (val) => {        
        this.setState({
            selectedsub: val
        });
    }

    getSubscriptionByDuration = (duration, name) => {
        var sub = null;
        sub = this.state.allsubs.filter((s, index) => {
            if(s.slug == name && s.duration == duration){
                return true;
            }else{
                return false;
            }
        });

        if(sub.length != 0){
            if(sub[0].id == this.state.selectedsub){
                sub[0].selected = true;
            }else{
                sub[0].selected = false;
            }
            return sub[0];
        }else{
            return null;
        }
    }

    getAddonsByDuration = (duration) => {
        var addon = null;
        addon = this.state.alladdons.filter((a, index) => {
            if(a.duration == duration){
                return true;
            }else{
                return false;
            }
        });

        return addon;
    }

    isAddonSelected = (value) => {
        let isSelected = false;
        this.state.selectedaddons.forEach((selected) => {
            if (value == selected) {
                isSelected = true;
            }
        });

        return isSelected;
    }

    getSubscriptionById = (id) => {
        var sub = null;
        this.state.allsubs.forEach((s, index) => {
            if(s.id == id){
                sub = s
            }
        });
        return sub;
    }

    startSubscriptionChange = () => {
        var nextsubstartdate = null;        
        if(this.props.currentsub.nextrenewal_on != null){            
            nextsubstartdate = moment(this.props.currentsub.nextrenewal_on.date);                    
        }else{
            nextsubstartdate = moment(this.props.expiration);
        }

        this.setState({
            page: 1,
            nextSubStartsOn: nextsubstartdate
        });
    }

    calculateSubscriptionTotals = () => {        
        var state = this.state;
        state.paymenttotals.subscription = this.getSubscriptionById(this.state.selectedsub);
        state.paymenttotals.addons = [];
        state.selectedaddons.forEach((aid) => {
            state.alladdons.forEach((addon) => {
                if(addon.id == aid){
                    state.paymenttotals.addons.push({
                        name: addon.name,
                        price: addon.amount,
                        duration: addon.duration
                    });
                }
            });
        });

        var total = parseFloat(state.paymenttotals.subscription.amount);
        state.paymenttotals.addons.forEach((addon) => {
            total += parseFloat(addon.price);
        });
        state.paymenttotal = total;

        //if(state.nextSubStartsOn != null){            
        //    state.nextSubStartsOn.add(parseInt(state.paymenttotals.subscription.duration), 'M');            
        //}
        this.setState(state);     
        
        return total;
    }

    cancelSubscriptionRenewal = () => {
        var confirmation = confirm("Are you sure you want to cancel your subscription?");
        if(confirmation){
            this.api.post("vendors/" + this.state.vendor.id + "/cancelsubscription",null).then((res) => {
                if(res.status == "OK"){
                    alert("Your subscription has been canceled.  It will not renew at the end of this period.");
                    window.location.reload();
                }
            });
        }
    }

    submitPayment = () => {
        console.log("Submitting payment...");
        if (this.state.paymenttotal > 0) {
            var failedvalidation = false;
            var state = this.state;
            console.log(state);
            var errors = validatejs(state, this.constraints);
            if(errors !== undefined){
                var fieldkeys = Object.keys(errors);
                state.invalidfields = fieldkeys;
                this.setState(state);
                failedvalidation = true;
            }

            if(!jQuery.payment.validateCardNumber(state.ccn)){
                state.invalidfields = ["ccn"];
                failedvalidation = true;
            }

            var ccnexpiry = jQuery.payment.cardExpiryVal(state.expdate);

            if(!jQuery.payment.validateCardExpiry(ccnexpiry.month, ccnexpiry.year)){
                state.invalidfields = ["expdate"];
                failedvalidation = true;
            }

            var type = jQuery.payment.cardType(state.ccn);

            if(!jQuery.payment.validateCardCVC(state.cvc, type)){            
                state.invalidfields = ["cvc"];
                failedvalidation = true;
            }

            if(failedvalidation){
                this.setState(state);
                return;
            }else{
                state.invalidfields = [];
                this.setState(state);
            }

            Stripe.card.createToken({
                name: state.nameoncard,
                number: state.ccn,
                cvc: state.cvc,
                exp_month: ccnexpiry.month,
                exp_year: ccnexpiry.year
            }, (status, response) => {
                if(response.error){
                    alert("There was an error processing your card: " + response.error.message);                
                    state.isLoading = false;
                }else{
                    var cctoken = response.id;
                    this.purchaseSubscription(cctoken);                
                }
            });
        } else {
            this.purchaseSubscription(null);  
        }
    }

    purchaseSubscription = (cctoken) => {
        var state = this.state;
        this.api.post("vendors/" + this.state.vendor.id + "/subscribe",{
            sub: this.state.selectedsub,
            addons: this.state.selectedaddons,
            cctoken: cctoken
        }).then((response) => {            
            if(response.status == "OK"){
                if(this.props.isaccount == false){
                    this.setState({
                        isLoading: false,
                        isValid: true,
                        page: 3
                    });                    
                }else{
                    alert("Subscription Purchased.");
                    window.location.reload();
                }
            }else{
                this.setState({
                    isLoading: false
                });
                alert("There was an error processing your susbcription: " + response.message); 
            }
            
        }).catch((error) => {
            state.isLoading = false;
            alert("There was an error processing your susbcription.  Contact Bridal Team for support.");
            this.setState(state);
        });
    }

    changeSubscription = () => {  
        this.setState({
            isLoading: true
        });
        
        this.api.post("vendors/" + this.state.vendor.id + "/changesubscription",{
            sub: this.state.selectedsub,
            addons: this.state.selectedaddons,
            startson: this.state.nextSubStartsOn.format("YYYY-MM-DD HH:MM:SS")
        }).then((response) => {
            var state = this.state;
            state.isLoading = false;
            this.setState(state);
            if(response.status == "OK"){
                alert("Subscription Updated.");
                window.location.reload();
                
            }else{
                alert("There was an error processing your susbcription: " + response.message); 
            }
            
        }).catch((error) => {
            var state = this.state;
            state.isLoading = false;            
            this.setState(state);
            alert("There was an error processing your susbcription.  Contact Bridal Team for support.");
        });
    }

    render(){
        return (
            <div id="subscriptionmanager">
                { this.props.isaccount ?
                    <div id="currentpackage">
                        <h1>
                            Current Subscription: {this.props.currentsub.name}<br/>
                            <small>Expires {moment(this.props.expiration).format("MM-DD-YYYY")} {this.props.currentsub.nextrenewal_on == null ? <span>- CANCELED</span> : null }</small>

                        </h1>
                        <ul>
                            {this.props.currentsub.addons.map((addon, index) => {
                                return(
                                    <li key={index}>{addon.details.name}</li> 
                                );
                            })}
                                               
                        </ul>
                        <div className="monthlyprice">${this.props.currentsub.subtotal}/month</div>

                        <div className="subscriptionoptions">                            
                            <a onClick={this.startSubscriptionChange} className="btn">Change Subscription</a>
                            {this.props.currentsub.nextrenewal_on != null ?
                                <a onClick={this.cancelSubscriptionRenewal} className="btn">Cancel Subscription</a> 
                            : null }
                        </div>
                    </div> : null                    
                }
                { this.props.isaccount && this.state.page == 0 && this.props.nextsub != null ? 
                    <div id="currentpackage" className="upcoming">
                        <h1>
                            Upcoming Subscription: {this.props.nextsub.name}<br/>
                            <small>Starts {moment(this.props.nextsub.periodstarts_on.date).format("MM-DD-YYYY")}</small>

                        </h1>
                        <ul>
                            {this.props.nextsub.addons.map((addon, index) => {
                                return(
                                    <li key={index}>{addon.details.name}</li> 
                                );
                            })}
                                               
                        </ul>
                        <div className="monthlyprice">${this.props.nextsub.subtotal}/month</div>
                    </div>     
                  : null
                }
                { this.state.page == 1 ?
                    <div id="vendorpackage">
                        {this.props.currentsub == null ? <h2>What type of subscription do you want?</h2> : null }
                        {this.props.currentsub != null ? <h2>What type of subscription would you like to switch to?</h2> : null }
                        <div className="subduration">
                            <Duration duration="1" selectedsub={this.state.selectedduration} durationname="Renew Every Month" onDurationClick={this.selectDuration} />
                            <Duration duration="6" selectedsub={this.state.selectedduration} durationname="Renew Every 6 Months " onDurationClick={this.selectDuration} />
                            <Duration duration="12" selectedsub={this.state.selectedduration} durationname="Renew Every Year " onDurationClick={this.selectDuration} />
                        </div>
                        {this.state.selectedduration != null ? 
                            <div id="packagedetails">
                                <Package sub={this.getSubscriptionByDuration(this.state.selectedduration, "free")} onPackageSelect={this.selectPackage} />
                                <Package sub={this.getSubscriptionByDuration(this.state.selectedduration, "bronze")} onPackageSelect={this.selectPackage}  />
                                <Package sub={this.getSubscriptionByDuration(this.state.selectedduration, "silver")} onPackageSelect={this.selectPackage}  />
                                <Package sub={this.getSubscriptionByDuration(this.state.selectedduration, "gold")} onPackageSelect={this.selectPackage}  />                                
                            </div> : null
                        }
                        {this.state.selectedduration != null ?
                            <div id="addondetails">
                                <h2>Add-Ons for Vendor Search</h2>
                                <table cellPadding={0} cellSpacing={0}>
                                    <tbody>
                                        {this.getAddonsByDuration(this.state.selectedduration).map((addon, index) => {
                                            
                                            return ( <Addon key={index} addon={addon} checked={this.isAddonSelected(addon.id)} onAddonToggle={this.handleAddonChange} /> )
                                        })}
                                    </tbody>                                    
                                </table>
                            </div> : null
                        }
                        <div className="pagination"> 
                            {this.state.selectedsub != null ? <a className="btn" onClick={this.nextPage}>Checkout</a> : null }
                        </div>
                         
                    </div>
                    : null }
                { this.state.page == 2 ?
                    <div id="vendorpayment">                            
                        <div id="carddetails">
                            <form className="form" id="vendorpaymentform">
                                <div className="cardcontainer"></div>
                                <div className="formsection">
                                    <h3>Subscription <span>Review</span></h3>
                                    <table className="totals">
                                        <tbody>
                                            <tr>
                                                <td>{this.state.paymenttotals.subscription.name} Package</td>
                                                <td>${this.state.paymenttotals.subscription.amount}</td>
                                            </tr>
                                            { this.state.paymenttotals.addons.map((addon, index)=>{
                                                return (
                                                    <tr key={index}>
                                                        <td>Addon: {addon.name}</td>
                                                        <td>${addon.price}</td>
                                                    </tr>
                                                )
                                            })}
                                            
                                            <tr className="totalsline">
                                                <td>Total due</td>
                                                {this.state.nextSubStartsOn == null ? <td>${this.state.paymenttotal} every {this.state.paymenttotals.subscription.duration} month(s)</td> : null}
                                                {this.state.nextSubStartsOn != null ? <td>${this.state.paymenttotal} (due {this.state.nextSubStartsOn.format('MM/DD/YYYY')})</td> : null}
                                                
                                            </tr>
                                        </tbody>                                        
                                    </table>                                    
                                </div>            
                                { !this.props.isaccount && this.state.paymenttotal > 0 ?
                                    <div className="formsection">
                                        <h3>Payment <span>Details</span></h3>
                                        <div className="row">
                                            <div className="twelve columns">
                                                <input className="form-input" value={this.state.ccn} type="text" onChange={this.handleFieldChange} placeholder="card number" autoComplete="cc-number" name="ccn" />        
                                                <ErrorSpan invalidfields={this.state.invalidfields} message="You must enter a valid credit card number" for="ccn" />
                                            </div>                                                        
                                        </div>
                                        <div className="row">
                                            <div className="twelve columns">
                                                <input className="form-input" value={this.state.nameoncard} type="text" onChange={this.handleFieldChange} placeholder="name on card" name="nameoncard"/>       
                                                <ErrorSpan invalidfields={this.state.invalidfields} message="You must enter your name as it appears on your credit card." for="nameoncard" />
                                            </div>                                                        
                                        </div>
                                        <div className="row">
                                            <div className="six columns">
                                                <input className="form-input" value={this.state.expdate} type="text" onChange={this.handleFieldChange} placeholder="MM/YYYY" autoComplete="cc-exp" name="expdate"/>                                                                    
                                                <ErrorSpan invalidfields={this.state.invalidfields} message="You must enter your card expiration date." for="expdate" />
                                            </div>
                                            <div className="six columns">
                                                <input className="form-input" value={this.state.cvc} type="text" onChange={this.handleFieldChange} placeholder="CVC" autoComplete="off" name="cvc"/>
                                                <ErrorSpan invalidfields={this.state.invalidfields} message="You must enter a valid CVC number." for="cvc" />
                                            </div>
                                        </div>
                                    </div> : null                                
                                }                                   
                            </form>
                        </div>    
                        <div className="pagination"> 
                            <a className="btn" onClick={this.cancelCheckout}>Back</a>
                            { !this.props.isaccount ?
                                <a className="btn" onClick={this.submitPayment}>Complete Purchase</a> : null
                            }

                            {this.props.isaccount ? 
                                <a className="btn" onClick={this.changeSubscription}>Update Subscription</a> : null
                            }

                        </div>
                    </div> : null
                } 
                { this.state.page == 3 ?
                    <div id="vendorpaymentconfirmation">
                        <h1 style={{textAlign: "center"}}>Your subscription has been updated.  Thank you for your purchase!</h1>
                        {this.props.isaccount == false ? 
                            <div className="pagination"> 
                                <a className="btn" onClick={this.props.nextStep}>Upload Your First Images</a>                            
                            </div>
                        : null }
                    </div> : null
                }  
            </div>
        )
    }
}

var Duration = (props) => {
    { 
        var durationclass = "duration";
        if(props.duration == props.selectedsub){
            durationclass += " selected";
        }
    }

    return (
        <div className={durationclass} data-duration={props.duration} onClick={props.onDurationClick}>
            {props.durationname}
        </div>
    )
}

var Package = (props) => {
    return (
        <div className="package">
            <h1>{props.sub.name}</h1>
            <div className="price">${props.sub.amount}</div>
            <div className="options">
                <dl>
                    <dt>Number of Image Uploads</dt>
                    <dd>{props.sub.imagelimit}</dd>
                    <dt>Number of Video Uploads</dt>
                    <dd>{props.sub.videolimit}</dd>
                </dl>
            </div>
            <div className="packageselect">
                <a onClick={() => {props.onPackageSelect(props.sub.id)}} className="btn btn-action">
                    {props.sub.selected ? <i className="icon icon-check"></i> : null }
                     Select Package
                </a>
            </div>
        </div>
    )
}

var Addon = (props) => {
    return (
        <tr>
            <td>{props.addon.name}</td>
            <td>${props.addon.amount}</td>
            <td>
                <div className="form-group">
                    <label className="form-checkbox">
                        <input onChange={props.onAddonToggle} checked={props.checked} value={props.addon.id} type="checkbox" />
                        <i className="form-icon"></i> Select
                    </label>
                </div>
            </td>
        </tr>
    )
}

class ErrorSpan extends Component{    
    render(){        
        if(this.props.invalidfields.indexOf(this.props.for) != -1){
            return (
                <span className="error">{this.props.message}</span>
            )
        }else{
            return null
        }        
    }
}