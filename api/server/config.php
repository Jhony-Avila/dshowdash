<?php
/**
 * Server API - Configuration
 * @version 2.0.0-ENTERPRISE
 * @updated 2026-01-21
 *
 * P3.2: Credenciais movidas para /opt/dshow_secure/.env
 */

// Carregar variáveis do .env seguro
$envFile = '/opt/dshow_secure/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (!getenv($key)) {
            putenv("$key=$value");
        }
    }
}

return [
    'hostinger' => [
        'base_url' => 'https://developers.hostinger.com/api/vps/v1',
        'token' => getenv('HOSTINGER_API_TOKEN') ?: '',
        'vm_id' => getenv('HOSTINGER_VM_ID') ?: '920234',
        'timeout' => 10
    ],

    'cache' => [
        'enabled' => true,
        'ttl' => 30,
        'path_status' => __DIR__ . '/.cache/server_status_cache.json',
        'path_cpu' => __DIR__ . '/.cache/cpu_cache.json',
        'path_memory' => __DIR__ . '/.cache/memory_cache.json'
    ],

    'specs' => [
        'total_cpus' => 8,
        'total_memory' => 34359738368,
        'total_disk' => 419430400000
    ]
];
