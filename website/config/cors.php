<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Laravel CORS
    |--------------------------------------------------------------------------
    |
    | Origins are restricted to the value(s) of the ALLOW_ORIGIN env var
    | (comma-separated for multiple front-end hosts). If unset, we fall back
    | to APP_URL rather than a wildcard, so a misconfiguration fails closed
    | to the app's own origin instead of allowing every site on the internet.
    |
    | Do NOT reintroduce '*' here: with a wildcard, any website could drive the
    | API from a victim's browser.
    |
    */

    'supportsCredentials' => false,
    'allowedOrigins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('ALLOW_ORIGIN', env('APP_URL', 'http://localhost')))
    ))),
    'allowedHeaders' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    'allowedMethods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'exposedHeaders' => [],
    'maxAge' => 3600,

];
