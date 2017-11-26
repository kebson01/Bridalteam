import axios from "axios";

export default class Api{
    constructor(){
        this.apiendpoint = "";
        if(process.env.NODE_ENV == "production"){
            this.apiendpoint = "http://api.bridalteam.com";
        }else{
            this.apiendpoint = "http://bridalteam.dev";
        }
        this.client = null;
        var token = Cookies.get('btvendortoken');
        if(token !== undefined && token != ""){
            this.client = axios.create({
                baseURL: this.apiendpoint + '/api/v1/',
                headers: {"Authorization": "Bearer " + token}
            });
        }else{
            this.client = axios.create({
                baseURL: this.apiendpoint + '/api/v1/'
            });
        }           

        this.get = this.get.bind(this);

    }

    get(endpoint){
        return this.client.get(endpoint).then((response) => {
            let data = response.data;
            return data;
        });
    }

    post(endpoint, data){
        return this.client.post(endpoint, data).then((response) => {
            let data = response.data;
            return data;
        });
    }
}