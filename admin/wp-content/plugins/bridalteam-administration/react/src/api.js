import axios from "axios";

export default class Api{
    constructor(){
        if(process.env.NODE_ENV == "production"){
            this.apiendpoint = "https://www.bridalteam.com";
        }else{
            this.apiendpoint = "http://bridalteam.localhost";
        }
        
        this.client = null;   

        
        /*if(token !== undefined && token != ""){
            this.client = axios.create({
                baseURL: this.apiendpoint + '/api/v1/',
                headers: {"Authorization": "Bearer " + token}
            });
        }else{
            this.client = axios.create({
                baseURL: this.apiendpoint + '/api/v1/'
            });
        } */   
        
        this.client = axios.create({
            baseURL: this.apiendpoint + '/api/v1/admin/',
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        });

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

    put(endpoint, data){
        return this.client.put(endpoint, data).then((response) => {
            let data = response.data;
            return data;
        });
    }
    
}