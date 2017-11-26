import React, {Component} from 'react';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

export default class CatQuestions extends Component{
    render(){
        return(
            <div className="category_questions">
                { this.props.questions.map((question, i) => {
                    if(question.multiple === undefined){
                        return (
                            <div key={i} className="row">
                                <label>{question.question} <span>*</span></label>
                                <CheckboxGroup value={this.props.catanswers['catquestion_' + i]} name={"catquestionanswers[" + i + "]"} onChange={(val) => { this.props.handleCatAnswersChange(val, i) }}>
                                    <ul>
                                        {question.options.map((option, index) => {
                                            return(
                                                <li key={index}>
                                                    <Checkbox value={index} /> <strong>{option}</strong>                                                        
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </CheckboxGroup>
                            </div>
                        )
                    }
                    if(question.multiple == false){
                        var selectoptions = [];
                        question.options.forEach((option, index) => {
                            selectoptions.push({
                                value: index,
                                label: option
                            });
                        })
                        return (
                            <div key={i} className="row">
                                <label>{question.question} <span>*</span></label>
                                <Select name={"catquestionanswers[" + i + "]"} value={this.props.catanswers['catquestion_' + i]} options={selectoptions} onChange={(val) => { this.props.handleCatAnswersChange(val.target.value, i)} } />                                                            
                            </div>
                        )
                    }                            
                })}
            </div>
        );       
    }
}

var Select = (props) => {    
    return (
        <select name={props.name} value={props.value} onChange={props.onChange} className="form-select">
            {props.options.map((val, index) => {
                return (
                    <option key={index} value={val.value}>{val.label}</option>
                );
            })}

        </select>
    )
}