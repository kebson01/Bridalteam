import React from 'react';
import querystring from 'query-string';
import Api from './api';

export default class ReviewMedia extends React.Component{
    constructor(state){
        super(state);
        
        var query = querystring.parse(window.location.search);

        this.api = new Api();
        this.state = {
            id: query.id,
            media: {
                media: {
                    isproduct: false  
                },
                vendor:{
                    businessname: ""
                }
            },
            colors: [],
            themes: [],
            categories: [],
            review: "",
            reviewcomments: ""
        }
    }

    componentDidMount(){
        this.getMedia();        
    }

    handleFieldChange = (e, index) => {
        var state = this.state;
        if(e.target.type == "checkbox"){
            state.media.media[e.target.name] = e.target.checked;
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
                    state.media.media[e.target.name] = value;
                }else{                    
                    state.media.media[e.target.name] = e.target.value;
                }
            }else{
                state.media.media[e.target.name] = e.target.value;
            }            
        }
        
        this.setState(state);
        console.log(this.state);
    }

    handleReviewChange = (e, index) => {
        var state = this.state;
        state[e.target.name] = e.target.value;
        this.setState(state);
        console.log(this.state);
    }

    getMedia = () => {
        this.api.get('media/' + this.state.id ).then((res) => {
            console.log(res);

            var reviewed = "";
            if(res.media.approved != null){
                if(res.media.approved == 1){
                    reviewed = "true";
                }else{
                    reviewed = "false";
                }
            }

            this.setState({                
                media: res.media,
                colors: res.colors,
                themes: res.themes,
                categories: res.categories,  
                review: reviewed,
                reviewcomments: res.media.reason       
            })
        });
    }

    saveMedia = () => {        
        this.api.post('media/' + this.state.media.media.id, this.state.media.media).then((res) => {
            if(this.state.review != ""){
                this.api.post('media/' + this.state.id + "/review", {
                    review: this.state.review,
                    reviewcomments: this.state.reviewcomments
                }).then((res) => {
                    alert("Media Saved.");
                    window.location = '/wp-admin/admin.php?page=bridalteamadmin_media';
                });
            }else{
                alert("Media Saved.");
            }
        });
    }

    render(){
        return (
            <div id="bridalteam_admin">
                <br/>
                <h1>Item #{this.state.id} - {this.state.media.vendor.businessname}</h1>
                <div id="bridalteam_media_review">
                    <div id="media_preview">
                        <img src={ this.api.apiendpoint + "/storage" + this.state.media.media.thumbnailpath} />
                        <br/>
                        <div id="media_review_controls">
                        <table className="form-table">
                            <tbody>
                                <tr>
                                    <th>Select Review Option</th>
                                    <td>
                                        <select value={this.state.review} name="review" onChange={this.handleReviewChange}>
                                            <option>Select Review Option</option>
                                            <option value={false}>Deny</option>
                                            <option value={true}>Approve</option>
                                        </select>
                                    </td>
                                </tr>
                                {this.state.review == "false" ? 
                                <tr>
                                    <th>Comments</th>
                                    <td>
                                        <textarea name="reviewcomments" onChange={this.handleReviewChange} value={this.state.reviewcomments}></textarea>
                                    </td>
                                </tr> : null
                                }
                            </tbody>
                        </table>
                        </div>
                    </div>
                    <div id="media_details">
                        <table className="form-table">
                            <tbody>
                                <tr>
                                    <th>Is this a product?</th>
                                    <td><input checked={this.state.media.media.isproduct} name="isproduct" value={true} onChange={this.handleFieldChange} type="checkbox" /></td>
                                </tr>
                                { this.state.media.media.isproduct ?
                                <tr>
                                    <th>Product Link</th>
                                    <td><input className="form-input" value={this.state.media.media.product_link} name="product_link" onChange={this.handleFieldChange} type='text' placeholder="" /></td>
                                </tr> : null
                                }
                                <tr>
                                    <th>Color</th>
                                    <td>
                                        <select name="color" value={this.state.media.media.color} onChange={this.handleFieldChange}>
                                            <option>Select a Color</option>
                                            {this.state.colors.map((color, index) => {
                                                return (
                                                    <option key={index} value={color.id}>{color.name}</option>
                                                )
                                            })}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Theme</th>
                                    <td>
                                        <select name="theme" value={this.state.media.media.theme} onChange={this.handleFieldChange}>
                                            <option>Select a Theme</option>
                                            {this.state.themes.map((theme, index) => {
                                                return (
                                                    <option key={index} value={theme.id}>{theme.name}</option>
                                                )
                                            })}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th>Categories</th>
                                    <td>
                                        <select name="category" value={this.state.media.media.category} onChange={this.handleFieldChange}>
                                            <option>Select a Category</option>
                                            {this.state.categories.map((cat, index) => {
                                                return (
                                                    <option key={index} value={cat.id}>{cat.name}</option>
                                                )
                                            })}
                                        </select>
                                    </td>
                                </tr>
                                {this.state.media.media.category != null ?
                                    <tr>
                                        <th>Subcategory</th>
                                        <td>
                                            <select>
                                                <option>Select a Category</option>
                                                {this.state.categories.map((cat, index) => {
                                                    if(cat.parent_category == this.state.media.media.category){
                                                        return (
                                                            <option key={index} value={cat.id}>{cat.name}</option>
                                                        )
                                                    }                                                    
                                                })}
                                            </select>
                                        </td>
                                    </tr>: null
                                }
                                <tr>
                                    <th>Keywords</th>
                                    <td><input className="form-input" name="keyword" value={this.state.media.media.keyword} type='text' onChange={this.handleFieldChange} placeholder="example, keyword 1, keyword 2 ..." /></td>
                                </tr>
                            </tbody>
                        </table>    
                        <p className="submit">
                            <input type="submit" className="button button-primary" onClick={this.saveMedia} value="Save Changes" />
                        </p>                    
                    </div>
                </div>
            </div>
        );
    }
}