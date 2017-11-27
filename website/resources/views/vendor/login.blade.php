@extends('layouts.main')

@section('page')
    <div id="page">
        <div id="vendorlogin" class="page">   
            <span class="overlay"></span>     
            <div id="pagebody">
                <div class="innerwrapper">
                    <div class="content">
                        <form id="vendorloginform" class="form">
                            <h1>Vendor Login</h1>                                              
                            <div class="form-group">                            
                                <label class="form-label">Email Address</label>
                                <input class="form-input" type="text" name="email" required="">                            
                            </div>
                            <div class="form-group"> 
                                <label class="form-label">Password</label>
                                <input class="form-input" type="password" name="password" required="">                            
                            </div>
                            <div class="form-group"> 
                                <a class="btn block" id="loginSubmit" >Login</a>
                                <a class="btn block" href="/vendor/register">Create an Account</a>
                                <!--<a class="btn block" href="/vendor/password">Forgot Password</a>-->
                            </div> 
                            <div class="pageloading" style="display:none;">
                                <div class="sk-circle">
                                    <div class="sk-circle1 sk-child"></div>
                                    <div class="sk-circle2 sk-child"></div>
                                    <div class="sk-circle3 sk-child"></div>
                                    <div class="sk-circle4 sk-child"></div>
                                    <div class="sk-circle5 sk-child"></div>
                                    <div class="sk-circle6 sk-child"></div>
                                    <div class="sk-circle7 sk-child"></div>
                                    <div class="sk-circle8 sk-child"></div>
                                    <div class="sk-circle9 sk-child"></div>
                                    <div class="sk-circle10 sk-child"></div>
                                    <div class="sk-circle11 sk-child"></div>
                                    <div class="sk-circle12 sk-child"></div>
                                </div>
                            </div>                         
                        </form>
                    </div>                
                </div>
            </div>
        </div>
    </div> 
@endsection