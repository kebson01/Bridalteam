import React, {Component} from 'react';
import BrideApi from './brideapi';

/*
 * Login / registration panel for brides.  On success it stores the bride JWT
 * cookie and calls onAuthed(bride) so the app can switch to the social view.
 */
export default class BrideAuth extends Component{
    constructor(props){
        super(props);
        this.api = new BrideApi();
        this.state = {
            mode: props.mode ? props.mode : "login",
            firstname: "",
            lastname: "",
            email: "",
            password: "",
            error: "",
            busy: false
        };
    }

    handleChange = (e) => {
        var s = {};
        s[e.target.name] = e.target.value;
        this.setState(s);
    }

    switchMode = (mode) => {
        this.setState({mode: mode, error: ""});
    }

    submit = () => {
        this.setState({busy: true, error: ""});
        if(this.state.mode == "register"){
            this.api.post("brides/register", {
                firstname: this.state.firstname,
                lastname: this.state.lastname,
                email: this.state.email,
                password: this.state.password
            }).then((res) => this.handleAuthResponse(res))
              .catch(() => this.setState({busy: false, error: "Something went wrong. Please try again."}));
        }else{
            this.api.post("brides/login", {
                email: this.state.email,
                password: this.state.password
            }).then((res) => this.handleAuthResponse(res))
              .catch(() => this.setState({busy: false, error: "Invalid email or password."}));
        }
    }

    handleAuthResponse = (res) => {
        if(res.status == "OK" && res.token){
            BrideApi.setToken(res.token);
            this.setState({busy: false});
            if(this.props.onAuthed){
                this.props.onAuthed(res.bride);
            }
        }else{
            this.setState({busy: false, error: res.message ? res.message : "Could not sign you in."});
        }
    }

    render(){
        var isRegister = this.state.mode == "register";
        return (
            <div className="brideauth">
                <div className="authcard">
                    <h2>{isRegister ? "Join the Community" : "Welcome Back"}</h2>
                    <p className="sub">
                        {isRegister ?
                            "Create a free account to save inspiration, build boards and follow other brides." :
                            "Log in to your inspiration account."}
                    </p>
                    {this.state.error ? <div className="autherror">{this.state.error}</div> : null}
                    {isRegister ?
                        <div className="row2">
                            <input type="text" name="firstname" placeholder="First name" value={this.state.firstname} onChange={this.handleChange} />
                            <input type="text" name="lastname" placeholder="Last name" value={this.state.lastname} onChange={this.handleChange} />
                        </div> : null
                    }
                    <input type="email" name="email" placeholder="Email address" value={this.state.email} onChange={this.handleChange} />
                    <input type="password" name="password" placeholder="Password" value={this.state.password} onChange={this.handleChange} />
                    <a className={"btn block" + (this.state.busy ? " busy" : "")} onClick={this.state.busy ? null : this.submit}>
                        {this.state.busy ? "Please wait…" : (isRegister ? "Create Account" : "Log In")}
                    </a>
                    <div className="switchmode">
                        {isRegister ?
                            <span>Already have an account? <a onClick={() => this.switchMode("login")}>Log in</a></span> :
                            <span>New here? <a onClick={() => this.switchMode("register")}>Create an account</a></span>
                        }
                    </div>
                </div>
            </div>
        );
    }
}
