import React, {Component} from 'react';
import StepZilla from 'react-stepzilla';

import VendorInfoForm from './firstrun/vendorinfo';
import SubscriptionManager from '../misc/subscriptions';
import MediaManager from '../misc/mediamanager';

export default class FirstRunForm extends Component{
    constructor(props){
        super(props);

        this.state = {
            step: 0
        }

        this.steps = [
            {name: "Profile Info", component: <VendorInfoForm nextStep={this.nextStep} />},
            {name: "Subscription Info", component: <SubscriptionManager isaccount={false} nextStep={this.nextStep} />},
            {name: "Upload Media", component: <MediaManager nextStep={this.nextStep} />}
        ];
    }

    nextStep = () => {        
        var state = this.state;
        if(state.step == 2){
            this.redirectToAccount();
            return;
        }
        state.step++;
        this.setState({
            step: state.step
        });
    }

    redirectToAccount =() => {
        window.location.href = "/vendor/account";
    }

    render(){
        return (
            <div className="form">
                <h1>Continue your vendor registration below</h1>
                <div className="multi-step">
                    <ul className="step">
                        {this.steps.map((step, index) => {
                            var classstring = "step-item";
                            if(index == this.state.step){
                                classstring += " active";
                            }
                            return (
                                <li key={index} className={classstring}>
                                    <a>{step.name}</a>
                                </li>
                            )
                        })}
                    </ul>
                    {this.steps[this.state.step].component}
                    
                </div>             
            </div>      
        )
    }
}
