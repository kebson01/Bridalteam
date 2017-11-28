<?php
namespace App\Classes;

use GuzzleHttp\Client;

class WpApi{
    protected $url = "";

    public function __construct(){
        $this->url = env('ALLOW_ORIGIN') . "/wp-json/";
    }

    public function getMenu($id){
        $endpoint = $this->url . 'menus/v1/menus/' . $id;
        $menudata = $this->getData($endpoint);

        return $menudata->items;
    }

    public function getPage($slug){
        $endpoint = $this->url . 'wp/v2/pages/?slug=' . $slug;
        $returnedpages = $this->getData($endpoint);
        if(count($returnedpages) > 0){
            return $returnedpages[0];
        }else{
            return null;
        }        
    }


    private function getData($endpoint){
        $client = new Client();
        $response = $client->get($endpoint);
        $jsonresponse = (string) $response->getBody();
        return json_decode($jsonresponse);
    }
}