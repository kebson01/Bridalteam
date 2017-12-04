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

        //Remove admin url from menu URLs
        foreach($menudata->items as $item){
            if(strpos($item->url, env("ALLOW_ORIGIN")) !== false){
                $item->url = str_replace(env("ALLOW_ORIGIN"), "", $item->url);
            }
        }

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