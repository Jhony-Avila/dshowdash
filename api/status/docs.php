<?php
// Status Docs API - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P1.1: Migrado 'success' para 'ok'
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:docs';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $docsPath = '/var/www/dshowdash/docs';
    $count = is_dir($docsPath) ? count(glob("$docsPath/*.md")) + count(glob("$docsPath/**/*.md")) : 0;

    $data = [
        'status' => 'online',
        'total_docs' => $count,
        'last_updated' => date('Y-m-d')
    ];

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
