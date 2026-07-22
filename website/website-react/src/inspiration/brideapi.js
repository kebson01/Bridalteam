import axios from "axios";

/*
 * API client for the bride social features.  Mirrors the vendor Api client but
 * authenticates with the bride token cookie (btbridetoken) so brides and
 * vendors can be logged in independently.
 */
export default class BrideApi{
    constructor(){
        this.apiendpoint = "";
        if(process.env.NODE_ENV == "production"){
            this.apiendpoint = "https://bridalteam.com";
        }else{
            this.apiendpoint = "http://bridalteam.test";
        }
        this.build();
    }

    build(){
        var token = null;
        if(typeof Cookies !== "undefined"){
            token = Cookies.get('btbridetoken');
        }
        if(token !== undefined && token != null && token != ""){
            this.client = axios.create({
                baseURL: this.apiendpoint + '/api/v1/',
                headers: {"Authorization": "Bearer " + token}
            });
        }else{
            this.client = axios.create({
                baseURL: this.apiendpoint + '/api/v1/'
            });
        }
    }

    static getToken(){
        if(typeof Cookies !== "undefined"){
            var t = Cookies.get('btbridetoken');
            return (t === undefined) ? null : t;
        }
        return null;
    }

    static setToken(token){
        if(typeof Cookies !== "undefined"){
            Cookies.set('btbridetoken', token, {expires: 30});
        }
    }

    static clearToken(){
        if(typeof Cookies !== "undefined"){
            Cookies.remove('btbridetoken');
        }
    }

    isLoggedIn(){
        return BrideApi.getToken() != null;
    }

    get(endpoint){
        return this.client.get(endpoint).then((response) => {
            return response.data;
        });
    }

    post(endpoint, data){
        return this.client.post(endpoint, data).then((response) => {
            return response.data;
        });
    }
}
