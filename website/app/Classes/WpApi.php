<?php
namespace App\Classes;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class WpApi{
    protected $url = "";

    public function __construct(){
        $this->url = env('ALLOW_ORIGIN') . "/wp-json/";
        Log::info('WpApi init', [
            'allow_origin' => env('ALLOW_ORIGIN'),
            'base_url' => $this->url
        ]);
    }

    public function getMenu($id){
        $endpoint = $this->url . 'menus/v1/menus/' . $id;
        Log::info('WpApi getMenu request', ['endpoint' => $endpoint]);
        $menudata = $this->getData($endpoint);

        //Remove admin url from menu URLs
        foreach($menudata->items as $item){
            if(strpos($item->url, env("ALLOW_ORIGIN")) !== false){
                $item->url = str_replace(env("ALLOW_ORIGIN"), "", $item->url);
            }
        }

        Log::info('WpApi getMenu response', ['count' => isset($menudata->items) ? count($menudata->items) : 0]);
        return $menudata->items ?? [];
    }

    public function getPage($slug){
        $endpoint = $this->url . 'wp/v2/pages/?slug=' . $slug;
        Log::info('WpApi getPage request', ['endpoint' => $endpoint, 'slug' => $slug]);
        $returnedpages = $this->getData($endpoint);
        if(is_array($returnedpages) && count($returnedpages) > 0){
            Log::info('WpApi getPage response', ['has_page' => true]);
            return $returnedpages[0];
        }else{
            Log::warning('WpApi getPage response empty', ['slug' => $slug]);
            return null;
        }        
    }


    private function getData($endpoint){
        try{
            $client = new Client();
            $response = $client->get($endpoint, ['timeout' => 10]);
            $jsonresponse = (string) $response->getBody();        
            return json_decode($jsonresponse);
        }catch(\Exception $e){
            Log::error('WpApi request failed', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            // Return structure that templates can tolerate
            if(strpos($endpoint, 'menus/v1/menus') !== false){
                return (object)['items' => []];
            }
            return [];
        }
    }
}