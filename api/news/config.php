<?php
/**
 * News API Configuration
 * @version 1.0.0
 */

return [
    'sources' => [
        'g1' => [
            'url' => 'https://g1.globo.com/rss/g1/',
            'name' => 'G1',
            'timeout' => 3,
            'enabled' => true
        ],
        'uol' => [
            'url' => 'https://noticias.uol.com.br/ultimas/index.xml',
            'name' => 'UOL',
            'timeout' => 3,
            'enabled' => true
        ],
        'estadao' => [
            'url' => 'https://www.estadao.com.br/rss/ultimas/',
            'name' => 'Estadão',
            'timeout' => 3,
            'enabled' => true
        ],
        'folha' => [
            'url' => 'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',
            'name' => 'Folha',
            'timeout' => 3,
            'enabled' => true
        ],
        'cnn' => [
            'url' => 'https://www.cnnbrasil.com.br/feed/',
            'name' => 'CNN Brasil',
            'timeout' => 3,
            'enabled' => true
        ]
    ],
    
    'cache' => [
        'enabled' => true,
        'ttl' => 300,
        'path' => __DIR__ . '/.cache/news_cache.json'
    ],
    
    'limits' => [
        'max_items' => 20,
        'max_title_length' => 200,
        'min_title_length' => 10
    ],
    
    'timeouts' => [
        'fetch' => 3,
        'total' => 8
    ],
    
    'retry' => [
        'enabled' => true,
        'max_attempts' => 2,
        'backoff' => 1
    ]
];
