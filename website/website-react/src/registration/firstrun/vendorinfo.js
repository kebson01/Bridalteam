import React, {Component} from 'react';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';
import CatQuestions from '../../misc/categoryquestions';
import Api from "../../api"

export default class VendorInfoForm extends Component{
    constructor(props){
        super(props);

        this.api = new Api();

        console.log(vendordata);

        var questions = JSON.parse(primaryquestions[0].questions);
        
        if(secondaryquestions.length != 0){
            secondaryquestions = JSON.parse(secondaryquestions[0].questions);
        }         

        this.state = {
            isLoading: false,
            questions: questions,
            secondquestions: secondaryquestions,
            vendor: vendordata,
            catanswers: {},
            secondcatanswers: {}
        }
    }

    isValidated = () => {        
        return this.saveCategoryQuestions();
    }

    handleCatAnswersChange = (newVal, question) => {
        var state = this.state;
        state.catanswers['catquestion_' + question] = newVal;
        console.log(state.catanswers);
        this.setState(state);        
    }

    handleSecondCatAnswersChange = (newVal, question) => {        
        var state = this.state;
        state.secondcatanswers['catquestion_' + question] = newVal;
        this.setState(state);        
    }

    completeStep = () => {
        if(this.isValidated()){
            this.props.nextStep();
        }
    }

    saveCategoryQuestions = () => {   
        //Validate questions

        var keys = Object.keys(this.state.catanswers);
        var questionsvalid = true;

        if(keys.length == this.state.questions.length){
            keys.forEach((key) => {
                var answerval = this.state.catanswers[key];
                if(Array.isArray(answerval)){
                    if(answerval.length == 0){
                        questionsvalid = false;
                    }else{
                        answerval.forEach((valueloop) => {
                            if(valueloop === "" ){
                                questionsvalid = false;
                            }
                        });
                    }                    
                }else{
                    if(answerval === ""){
                        questionsvalid = false;
                    }
                }                
            });            
        }else{
            questionsvalid = false;
        }

        if(this.state.secondcatanswers != null && this.state.secondquestions != null){
            keys = Object.keys(this.state.secondcatanswers);
            if(keys.length == this.state.secondquestions.length){
                keys.forEach((key) => {
                    var answerval = this.state.secondcatanswers[key];
                    if(Array.isArray(answerval)){
                        if(answerval.length == 0){
                            questionsvalid = false;
                        }else{
                            answerval.forEach((valueloop) => {
                                if(valueloop === "" ){
                                    questionsvalid = false;
                                }
                            });
                        } 
                    }else{
                        if(answerval === ""){
                            questionsvalid = false;
                        }
                    }                
                });            
            }else{
                questionsvalid = false;
            }
        }

        if(!questionsvalid){
            alert("You must fill out all questions to continue.");
            return false;
        }        

        
        
        this.api.post("vendors/" + this.state.vendor.id + "/questions",{
            cat: this.state.catanswers,
            subcat: this.state.secondcatanswers
        }).then((response) => {
            if(response.status != "OK"){
                alert("There was a problem saving your data: " + response.message);
                return false;
            }
        });

        return true;
    }

    render(){
        return (
            <div>
                <div className="formsection">
                    <h3><span className="categoryname">{primarycategory.name}</span> <span>Information</span></h3>
                    <CatQuestions questions={this.state.questions} catanswers={this.state.catanswers} handleCatAnswersChange={this.handleCatAnswersChange} />                    
                    <br/>
                    {secondarycategory != null ?
                        <h3><span className="categoryname">{secondarycategory.name}</span> <span>Information</span></h3>                        
                        : null
                    }

                    {secondarycategory != null ?
                        <CatQuestions questions={this.state.secondquestions} catanswers={this.state.secondcatanswers} handleCatAnswersChange={this.handleSecondCatAnswersChange} />                                            
                        : null
                    }

                    <div className="footer-buttons">
                        <a onClick={this.completeStep} className="btn">Save Profile Info</a>
                    </div>
                </div> 
            </div>
        )
    }
}