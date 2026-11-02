<?php
/**
 * Currencies API - Configuration
 * @version 1.1.0
 * @changelog Migrado de exchangerate.host para AwesomeAPI
 */

return [
    'coingecko' => [
        'base_url' => 'https://api.coingecko.com/api/v3',
        'endpoints' => [
            'simple_price' => '/simple/price'
        ],
        'timeout' => 10,
        'currencies' => ['usd', 'brl', 'cny']
    ],
    
    'awesomeapi' => [
        'base_url' => 'https://economia.awesomeapi.com.br',
        'endpoints' => [
            'last' => '/json/last'
        ],
        'timeout' => 10,
        'pairs' => [
            'usd_brl' => 'USD-BRL',
            'usd_cny' => 'USD-CNY'
        ]
    ],
    
    'cache' => [
        'enabled' => true,
        'ttl' => 300,
        'path_btc' => __DIR__ . '/.cache/btc_cache.json',
        'path_usd_brl' => __DIR__ . '/.cache/usd_brl_cache.json',
        'path_usd_cny' => __DIR__ . '/.cache/usd_cny_cache.json',
        'path_all' => __DIR__ . '/.cache/all_cache.json'
    ],
    
    'error_handling' => [
        'log_errors' => true,
        'fallback_enabled' => true,
        'max_retries' => 2
    ]
];