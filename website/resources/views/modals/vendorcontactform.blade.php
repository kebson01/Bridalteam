<form class="vendorcontact form">
    <div class="innerwrapper">
        <div class="formsection">
            <div class="row columns">
                <div class="six columns column col-xs-12 col-sm-6">
                    <label class="form-label">Bride First Name <span>*</span></label>
                    <input class="form-input" name="firstname" required type="text" />
                    
                </div>
                <div class="six columns column col-xs-12 col-sm-6">
                    <label class="form-label">Bride First Name <span>*</span></label>
                    <input class="form-input" name="lastname"  required type="text" />
                    
                </div>
            </div>            
            <div class="row columns">
                <div class="twelve columns column col-xs-12 col-sm-12">
                    <label class="form-label">Bride Email <span>*</span></label>
                    <input class="form-input" type="text" name="email" required />
                </div>
            </div>
            <div class="row columns">
                <div class="twelve columns column col-xs-12 col-sm-12">
                    <label class="form-label">Event Type *</label>
                    <div class="form-group">
                        <select clas="form-select" name="eventtype" required>
                            <option>Select an Event Type</option>
                            <option value="Wedding">Wedding</option>
                            <option value="Engagement Party">Engagement Party</option>
                            <option value="Wedding Shower">Wedding Shower</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="row columns">
                <div class="twelve columns column col-xs-12 col-sm-12" style="display:none">
                    <label class="form-label">Other Event Type</label>
                    <input class="form-input" type="text" name="othereventtype" />
                </div>
            </div>
           <div class="row columns">
                <div class="twelve columns column col-xs-12 col-sm-12">
                    <label class="form-label">Event Date <span>*</span></label>
                    <input class="form-input" type="text" name="eventdate" required />
                </div>
            </div>
            <div class="row columns">
                <div class="twelve columns column col-xs-12 col-sm-12">
                    <label class="form-label">Message *</label>
                    <textarea class="form-input" name="message" required></textarea>
                </div>
            </div>

            <div class="row columns">
                <div class="six columns column col-xs-12 col-sm-6">
                    <input id="btn_submit" type="submit" class="btn" value="Send" />
                </div>
                <div class="six columns column col-xs-12 col-sm-6">
                    <button id="btn_cancel" class="btn">Cancel</button>
                </div>
            </div>
        </div>
    </div>    
</form>