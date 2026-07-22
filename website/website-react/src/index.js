import React from 'react';
import { render } from 'react-dom';
import RegistrationForm from './registration/registerform';
import VerifyVendor from './registration/verifyvendor';
import VendorAccount from './account/account';
import FirstRunForm from './registration/firstrunform';
import VendorCategoryListing from './vendors/categorylisting';
import InspirationApp from './inspiration/inspirationapp';
import GalleryBridge from './inspiration/gallerybridge';

if(document.getElementById("registrationapp") != null){
    render(<RegistrationForm />, document.getElementById("registrationapp"));
}

if(document.getElementById("verificationapp") != null){
    render(<VerifyVendor />, document.getElementById("verificationapp"));
}

if(document.getElementById("accountapp") != null){
    render(<VendorAccount />, document.getElementById("accountapp"));
}

if(document.getElementById("firstrunapp") != null){
    render(<FirstRunForm />, document.getElementById("firstrunapp"));
}

if(document.getElementById("categoryapp") != null){
    render(<VendorCategoryListing />, document.getElementById("categoryapp"));
}

if(document.getElementById("inspirationapp") != null){
    render(<InspirationApp />, document.getElementById("inspirationapp"));
}

if(document.getElementById("gallerysaveroot") != null){
    render(<GalleryBridge />, document.getElementById("gallerysaveroot"));
}


