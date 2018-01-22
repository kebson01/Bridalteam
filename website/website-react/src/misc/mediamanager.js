import React, {Component} from 'react';
import Api from "../api";

import Dropzone  from 'react-dropzone';

export default class MediaManager extends Component{
    constructor(props){
        super(props);

        this.api = new Api();

        this.state = {
            isLoading: false,
            media: [],
            limit: 0,
            mediacolors: [],
            mediathemes: [],
            mediacategories: [],
            mediasubcategories: [],
            selectedmedia: 0
        }
    }

    refreshMedia = () => {
        this.api.get('media/vendormedia').then((data) => {
            if(data.status == "OK"){                
                var state = this.state;
                state.limit = data.limit;
                state.mediacategories = [];
                state.mediacategories.push({
                    value: "",
                    label: "Select a Category"
                });
                state.mediasubcategories = [];
                state.mediasubcategories.push({
                    value: "",
                    label: "Select a Sub Category"
                });
                data.categories.forEach((cat) => {
                    if(cat.parent_category == 0){
                        state.mediacategories.push({
                            value: cat.id,
                            label: cat.name
                        });
                    }else{
                        state.mediasubcategories.push({
                            value: cat.id,
                            label: cat.name,
                            parent_cat: cat.parent_category
                        });
                    }
                });
                
                data.colors.forEach((color) => {
                    state.mediacolors.push({
                        value: color.id,
                        label: color.name
                    })
                });
                data.themes.forEach((theme) => {
                    state.mediathemes.push({
                        value: theme.id,
                        label: theme.name
                    })
                });
                
                state.media = data.media;
                state.media.forEach((m) => {
                    m.selectmedia = false;
                    if(m.subcategories == null){
                        m.subcategories = [];
                    }else{
                        m.subcategories = JSON.parse(m.subcategories);
                    }
                });

                var emptymedia = state.limit - state.media.length;
                for(let i = 1;i<=emptymedia;i++){
                    state.media.push({
                        id: null,
                        index: i,
                        order: i,
                        selectmedia: false
                    });
                }

                this.setState(state);
            }
        });
    }

    uploadFiles = (file, media) => {        
        var data = new FormData();
        data.append("index", media.index);
        data.append("file", file[0]);

        this.api.post('media/uploadmedia', data).then((response) => {            
            if(response.status == "OK"){
                this.refreshMedia();
            }
        });
    }

    handleFieldChange = (e, index) => {
        var state = this.state;
        if(e.target.type == "checkbox"){
            state.media[index][e.target.name] = e.target.checked;
        }else{            
            if(e.target.tagName == "SELECT"){
                if(e.target.multiple){
                    var options = e.target.options;
                    var value = [];
                    for (var i = 0, l = options.length; i < l; i++) {
                        if (options[i].selected) {
                            value.push(options[i].value);
                        }
                    }
                    console.log(value);
                    state.media[index][e.target.name] = value;
                }else{
                    state.media[index][e.target.name] = e.target.value;
                }
            }else{
                state.media[index][e.target.name] = e.target.value;
            }            
        }
        
        this.setState(state);
    }

    saveMediaItem = (mediaindex) => {
        console.log(mediaindex);
        if(mediaindex !== undefined){
            var media = this.state.media[mediaindex];
            this.api.post('media/vendormedia/' + media.id, media).then((data) => {
                if(data.status == "OK"){
                    alert("Media Saved.");
                }
            })
        }else{
            var allsuccessful = true;
            this.state.media.forEach((m) => {                
                this.api.post('media/vendormedia/' + m.id, m).then((data) => {
                    if(data.status != "OK"){
                        allsuccessful = false;
                    }
                });
            });

            if(allsuccessful){
                alert("Media Saved");
                this.refreshMedia();
            }
        }
    }

    deleteMediaItem = (mediaindex) => {
        if(mediaindex !== undefined){
            if(confirm ("Are you sure you want to remove this media?")){
                var media = this.state.media[mediaindex];
                this.api.delete('media/vendormedia/' + media.id).then((data) => {
                    if(data.status == "OK"){
                        this.refreshMedia();
                        alert("Media deleted.");
                    }
                });
            }
        }
    }

    submitMediaItem = (mediaindex) => {
        if(mediaindex !== undefined){
            var media = this.state.media[mediaindex];
            this.api.post('media/vendormedia/' + media.id, media).then((data) => {
                if(data.status == "OK"){
                    this.api.post('media/submitvendormedia/' + media.id).then((data) => {
                        if(data.status == "OK"){
                            alert("Media Submitted for Review.");
                            this.refreshMedia();
                        }
                    });
                }
            });            
        }
    }

    componentDidMount(){
        this.refreshMedia();
    }

    render(){
        return (
            <div id="mediauploader">
                <div id="mediacontroller"></div>
                <div id="uploader">
                    {this.state.media.map((m, index) => {
                        return (
                            <Media 
                                key={index} 
                                index={index}
                                media={m} 
                                handleFieldChange={this.handleFieldChange}
                                endpoint={this.api.apiendpoint}
                                uploadFiles={this.uploadFiles}
                                handleFieldChange={this.handleFieldChange}
                                saveItem={this.saveMediaItem}
                                submitItem={this.submitMediaItem}
                                deleteItem={this.deleteMediaItem}
                                colors={this.state.mediacolors} 
                                themes={this.state.mediathemes} 
                                categories={this.state.mediacategories} 
                                subcategories={this.state.mediasubcategories}
                            />
                        )
                    })}
                </div>
                {this.props.nextStep !== undefined ?
                    <div className="footer-buttons">
                        <a onClick={this.props.nextStep} className="btn">Go to your account!</a>
                    </div>
                : null }
            </div>
        )
    }
}

class Media extends Component{
    constructor(props){
        super(props);
    }

    onDrop = (files) => {        
        this.props.uploadFiles(files, this.props.media);
    }

    handleFieldChange = (e) => {        
        this.props.handleFieldChange(e, this.props.index);
    }

    render(){
        var subcategoryoptions = [];
        this.props.subcategories.forEach((subcat) => {            
            if(subcat.parent_cat == this.props.media.category){
                subcategoryoptions.push({
                    value: subcat.value,
                    label: subcat.label
                });
            }
        });
        return (
            <div className="mediaitem">
                { this.props.media.id == null ?
                    <div className="placeholder">
                        <Dropzone style={{}} multiple={false} onDrop={this.onDrop}>
                            <i className="icon icon-upload"></i>
                            <div ref="uploadarea" className="uploadarea">Add Image Here</div>
                        </Dropzone>
                    </div> : null }

                { this.props.media.id != null ?
                    <div className="mediadetails">
                        { this.props.media.status == 1 ? <div className="reviewinprogress"><span>Under Review</span></div> : null}                        
                        <div className="imagepreview">
                            <img src={ this.props.endpoint + "/storage" + this.props.media.square_thumbnailpath} />
                            <div className="deletemedia">
                                <a onClick={() => {this.props.deleteItem(this.props.index)}}><i className="fa fa-trash-o" aria-hidden="true"></i></a>
                            </div>
                            { this.props.media.status == 0 ?
                            <div className="mediacontrols">
                                <a onClick={() => {this.props.saveItem(this.props.index) }} className="btn">Save</a>
                                <a onClick={() => {this.props.submitItem(this.props.index) }} className="btn">Submit</a>
                            </div>: null
                            }
                        </div>
                        <div className="imagedetails">
                            <div className="form">
                                <div className="row">
                                    <div className="twelve columns">
                                        <label className="form-checkbox">
                                            <input checked={this.props.media.isproduct} name="isproduct" value={true} onChange={this.handleFieldChange} type="checkbox" />                                                     
                                            <i className="form-icon"></i> Is this a product?
                                        </label>
                                    </div>
                                </div>
                                { this.props.media.isproduct ?
                                    <div className="row">
                                        <div className="twelve columns">
                                            <label>Product Link *</label>
                                            <input className="form-input" value={this.props.media.product_link} name="product_link" onChange={this.handleFieldChange} type='text' placeholder="" />
                                        </div>
                                    </div> : null
                                }
                                
                                <div className="row">
                                    <div className="twelve columns">
                                        <label>Color</label>
                                        <Select name="color" value={this.props.media.color} options={this.props.colors} onChange={this.handleFieldChange} />                                                                                                    
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="twelve columns">
                                        <label>Theme</label>    
                                        <Select name="theme" value={this.props.media.theme} options={this.props.themes} onChange={this.handleFieldChange} />                                    
                                    </div>
                                </div>  
                                <div className="row">
                                    <div className="twelve columns">
                                        <label>Categories</label>    
                                        <Select name="category" value={parseInt(this.props.media.category)} options={this.props.categories} onChange={this.handleFieldChange} />                                    
                                    </div>
                                </div> 
                                {this.props.media.category != null ?
                                    <div className="row">
                                        <div className="twelve columns">
                                            <label>Subcategories</label>    
                                            <Select multiple={true} name="subcategories" value={this.props.media.subcategories} options={subcategoryoptions} onChange={this.handleFieldChange} />                                    
                                        </div>
                                    </div> : null                                 
                                }
                                
                                <div className="row">
                                    <div className="twelve columns">
                                        <label>Keywords *</label>
                                        <input className="form-input" name="keyword" value={this.props.media.keyword} type='text' onChange={this.handleFieldChange} placeholder="example, keyword 1, keyword 2 ..." />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>: null
                }
            </div>
        );
    }
}

var Select = (props) => {    
    return (
        <select multiple={props.multiple} name={props.name} value={props.value} onChange={props.onChange} className="form-select">
            {props.options.map((val, index) => {
                return (
                    <option key={index} value={val.value}>{val.label}</option>
                );
            })}

        </select>
    )
}