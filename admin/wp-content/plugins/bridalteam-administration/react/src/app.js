import React from 'react';
import { render } from 'react-dom';

import VendorManagement from './vendors';
import EditVendor from './editvendors';

import MediaManagement from './media';
import ReviewMedia from './reviewmedia';

import ReviewVendorClaim from './reviewclaim';


if(document.getElementById("bridalteamadmin_vendor") != null){
    render(<VendorManagement />, document.getElementById("bridalteamadmin_vendor"));
}

if(document.getElementById("bridalteamadmin_editvendor") != null){
    render(<EditVendor />, document.getElementById("bridalteamadmin_editvendor"));
}

if(document.getElementById("bridalteamadmin_media") != null){
    render(<MediaManagement />, document.getElementById("bridalteamadmin_media"));
}

if(document.getElementById("bridalteamadmin_editmedia") != null){
    render(<ReviewMedia />, document.getElementById("bridalteamadmin_editmedia"));
}

if(document.getElementById("bridalteamadmin_reviewclaim") != null){
    render(<ReviewVendorClaim />, document.getElementById("bridalteamadmin_reviewclaim"));
}