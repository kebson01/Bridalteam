@extends('layouts.main')

@section('head')

@endsection


@section('page')
<div id="page">
    <div class="page" id="vendorprofile">
        <input type="hidden" value="<?php print $vendor->id; ?>" name="vid" />
        <?php if($vendor->backgroundimage != null): ?>
            <header style="background-image:url('<?php print "/storage". $vendor->backgroundimage; ?>');" class="pageheader">
        <?php else: ?>
            <header class="pageheader">
        <?php endif; ?>

            <div id="profile_header">
                <div id="profile_logo">  
                    <?php if($vendor->logo != null && $vendor->logo != ""): ?>                  
                        <img src="/storage<?php print $vendor->logo; ?>">
                    <?php else: ?>
                        <img src="/img/bt_placeholder.jpg" />                        
                    <?php endif; ?>                                      
                </div>
                <div id="profile_header_info">                    
                    <h1><?php print $vendor->businessname; ?></h1>
                    <div class="categories"><?php print $category->name; ?></div>
                    
                    <div class="profile_contact_info">   
                        <?php if($vendor->facebook != null && $vendor->facebook != ""): ?>                     
                            <a target="_blank" href="<?php print $vendor->facebook; ?>" class="social">
                                <i class="fa fa-facebook"></i>
                            </a>                       
                        <?php endif; ?>

                        <?php if($vendor->twitter != null && $vendor->twitter != ""): ?>  
                            <a target="_blank" href="<?php print $vendor->twitter; ?>" class="social">
                                <i class="fa fa-twitter"></i>
                            </a>
                        <?php endif; ?>
                        
                        <?php if($vendor->user_id != null): ?>  
                            <a class="vendorlink">
                                Contact Vendor
                            </a>               
                        <?php endif; ?>
                        <?php if($vendor->user_id == null): ?>         
                            <a href="/vendor/register?claim=<?php print $vendor->id; ?>" class="vendorlink">
                                Claim your business
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <span class="overlay"></span>
        </header>
        <div id="pagebody">
            <div class="innerwrapper">
                <div class="content">        
                    <?php if($vendor->user_id != null): ?>            
                        <div id="profile_details">
                            <div id="quickinfo">
                                <a class="vendorurl" target="_blank" href="<?php print $vendor->url; ?>"><i class="fa fa-share"></i> Vendor Website</a>
                                <a class="vendormobile" href="tel:<?php print $vendor->pcphone; ?>"><i class="fa fa-mobile"></i> <?php print $vendor->pcphone; ?></a>
                                <hr />
                                <div class="detail">    
                                    <i class="fa fa-user"></i>                                
                                    <strong>Contact</strong>
                                    <?php print $vendor->pcfirstname . " " . $vendor->pclastname; ?>
                                </div>
                                <div class="detail">    
                                    <i class="fa fa-map-marker"></i>                             
                                    <strong>Location</strong>
                                    <?php if($vendor->showcitystate): ?>                                
                                        <?php print $vendor->city . ", " . $vendor->state; ?><br/>
                                        <?php print $vendor->zip; ?>
                                    <?php else: ?>
                                        <?php print $vendor->address; ?><br/>
                                        <?php print $vendor->address2; ?><br/>                                    
                                        <?php print $vendor->city . ", " . $vendor->state; ?><br/>
                                        <?php print $vendor->zip; ?>
                                    <?php endif; ?>
                                </div>  
                                <div class="detail">    
                                    <i class="fa fa-money"></i>                             
                                    <strong>Budget</strong>
                                    $<?php print $vendor->minbudget; ?> - $<?php print $vendor->maxbudget; ?>
                                </div>                              
                            </div>
                            <div id="profile_tabs">
                                <ul>
                                    <li><a data-tab="tab_about" class="active">About</a></li>
                                    <li><a data-tab="tab_portfolio">Portfolio</a></li>
                                    <li><a data-tab="tab_services">Services</a></li>
                                    <li><a data-tab="tab_faq">FAQ</a></li>
                                </ul>

                                <a id="mobile_btn_about">About</a>
                                <div id="tab_about">
                                    <?php print $vendor->about; ?>
                                    <br/><br/>
                                    <h2>Some of our work</h2>
                                    <ul class="portfolio_preview">
                                        <?php foreach($vendor->media as $media): ?>
                                            <?php if($media->status == 2): ?>
                                                <li><a><img src="/storage<?php print $media->square_thumbnailpath; ?>" /></a></li>
                                            <?php endif; ?>
                                        <?php endforeach; ?>                                        
                                    </ul>
                                </div>

                                <a id="mobile_btn_portfolio">Portfolio</a>
                                <div id="tab_portfolio">                                
                                    <ul>
                                        <?php foreach($vendor->media as $media): ?>
                                            <?php if($media->status == 2): ?>
                                                <li><a><img src="/storage<?php print $media->square_thumbnailpath; ?>" /></a></li>
                                            <?php endif; ?>
                                        <?php endforeach; ?>    
                                    </ul>
                                </div>

                                <a id="mobile_btn_services">Services</a>
                                <div id="tab_services">
                                    <?php print $vendor->services; ?>                               
                                    <br/>
                                </div>

                                <a id="mobile_btn_faq">FAQ</a>
                                <div id="tab_faq">
                                    <ul>     
                                        <?php if(count($vendor->faqs) > 0): ?>
                                            <?php foreach($vendor->faqs as $faq): ?>                           
                                                <li>
                                                    <strong><?php print $faq->question; ?></strong><br/>
                                                    <?php print $faq->answer; ?>                                        
                                                </li>   
                                            <?php endforeach; ?>       
                                        <?php endif; ?>                     
                                    </ul>
                                </div>
                            </div>
                        </div>
                    <?php else: ?>
                        <div id="profile_claim_info">
                            <h1>Is this your company?  Claim your account now to fill out your profile!</h1>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection