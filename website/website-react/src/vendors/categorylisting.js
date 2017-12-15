import React, {Component} from 'react';
import states from '../misc/states';

export default class VendorCategoryListing extends Component{
    constructor(props){
        super(props);

        var filteroptions = {};
        var questionsArray = JSON.parse(questions.questions);

        questionsArray.forEach((question, index) => {
            filteroptions["question_" + index] = []            
        });
        
        this.state = {
            questions: questionsArray,
            categoryid: questions.category,
            filteroptions: filteroptions,
            vendors: vendors
        }
    }

    onFilterChange = (data) => {        
        var filteroptions = this.state.filteroptions;
        filteroptions[data.questionid] = data.options;        
        this.setState({
            filteroptions: filteroptions
        });

        this.refreshFilters();
    }

    refreshFilters = () => {
        console.log("Get new vendors....");
    }

    render(){
        return (
            <div id="vendorlisting">
                <a id="mobilevendorfilterbtn">Show Vendor Filters</a>
                <div id="vendor_filters">
                    <form id="vendor_filters_form">  
                        <FilterModule select={true} options={states} multiple={false} title="Location" type="State" />
                        <FilterModule select={true} options={states} multiple={false} title="Regions" type="Region" />
                        {this.state.questions.map((question, index) => {
                            return (
                                <FilterModule key={index} questionid={"question_" + index} category={this.state.categoryid} multiple={question.multiple} options={question.options} title={question.filterlabel} updatefilter={this.onFilterChange} />
                            )
                        })}
                    </form>
                </div>
                <div id="vendor_list">
                    {this.state.vendors.map((vendor, index) => {
                        return(
                            <Vendor key={index} vendor={vendor} />
                        )
                    })}
                    {this.state.vendors.length == 0 ?
                        <div className="empty">
                            <div className="empty-icon">
                                <i className="icon icon-stop"></i>
                            </div>
                            <p className="empty-title h5">No vendors found.</p>
                            <p className="empty-subtitle">Adjust your search filters, or select a different category.</p>                            
                        </div> : null
                    }
                </div>
                <div className="clear"></div>
            </div>
        )
    }
}

class Vendor extends Component{
    constructor(props){
        super(props);
    }
        
    render(){
        return (
            <article className="vendor">
                <a href={"/vendor/" + this.props.vendor.slug}>
                    {this.props.vendor.logo == null || this.props.vendor.logo == "" ?
                        <img src="/img/bt_placeholder.jpg" /> :
                        <img src={"/storage" + this.props.vendor.logo} />
                    }
                </a>
                <header>
                    <h1><a href={"/vendor/" + this.props.vendor.slug}>{this.props.vendor.businessname}</a></h1>
                </header>
            </article>
        )
    }
}

class FilterModule extends Component{
    constructor(props){
        super(props);
        
        var mutliple = this.props.multiple;
        if(this.props.multiple === undefined){
            mutliple = true;
        }

        var selected = null;
        if(mutliple){
            selected = [];
        }

        this.state = {
            keys: Object.keys(this.props.options),
            values: this.props.options,
            multiple: mutliple,
            selected: selected
            
        }
    }

    handleOptionSelection = (e, index) => {
        var selected = this.state.selected;
        console.log("Changed", e.target.checked, index);
        if(this.state.multiple){
            if(e.target.checked){
                selected.push(index);
            }else{
                if(selected.includes(index)){
                    selected.splice(selected.indexOf(index), 1);
                }
            }
        }else{
            selected = index;
        }
        this.setState({
            selected: selected
        });

        this.props.updatefilter({
            questionid: "question_" + this.props.questionid,
            options: selected
        });
    }

    clearSelection = () => {
        this.setState({
            selected: []
        });

        this.props.updatefilter({
            questionid: "question_" + this.props.questionid,
            options: []
        });
    }

    render(){
        return(
            <section className="filter_module">
                <h1>{this.props.title}</h1>
                {this.props.multiple ? 
                    <div className="options">

                    </div>:
                    <div className="options inline">    
                        {this.props.select ? 
                            <select className="form-select" required="">
                                <option value="">Select a {this.props.type}</option>
                                {this.state.keys.map((item, index) => {
                                    return (
                                        <option key={index} value={item}>{this.state.values[item]}</option>
                                    )
                                })}                                
                            </select> :
                            <span>
                                {this.state.keys.map((item, index) => {
                                    if(this.state.multiple){
                                        return (
                                            <div key={index} className="option">
                                                <input onChange={(e) => this.handleOptionSelection(e, index)} checked={this.state.selected.includes(index)} type="checkbox" name={"category[" + this.props.category + "][" + item + "]"}  />
                                                <label>{this.state.values[item]}</label>
                                            </div>
                                        )
                                    }else{
                                        return (
                                            <div key={index} className="option">
                                                <input type="radio" name={"category[" + this.props.category + "][" + item + "]"}  />
                                                <label>{this.state.values[item]}</label>
                                            </div>
                                        )
                                    }
                                    
                                })}
                                {this.state.multiple ? <a onClick={this.clearSelection} className="clearradio">Clear Selection</a> : null }
                            </span>
                            
                            
                        }
                    </div>
                }
            </section>
        )
    }
}