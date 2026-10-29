<?php
/**
 * Weather API - Configuration
 * @version 1.0.0
 */

return [
    'openmeteo' => [
        'base_url' => 'https://api.open-meteo.com/v1',
        'endpoints' => [
            'forecast' => '/forecast'
        ],
        'timeout' => 10,
        'sao_paulo' => [
            'latitude' => -23.5505,
            'longitude' => -46.6333,
            'timezone' => 'America/Sao_Paulo'
        ]
    ],
    
    'cache' => [
        'enabled' => true,
        'ttl' => 1800,
        'path_sao_paulo' => __DIR__ . '/.cache/weather_sp_cache.json'
    ],
    
    'error_handling' => [
        'log_errors' => true,
        'fallback_enabled' => true
    ]
];
