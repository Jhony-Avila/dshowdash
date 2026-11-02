<?php
// Mercado Livre Integration Status - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P0.1 FIX: Usa CorsPolicy como fonte única
// P2.2 FIX: Redis isolado em helper
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:mercadolivre';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $isConfigured = false;

    if ($isConfigured) {
        $data = [
            'status' => 'online',
            'configured' => true,
            'orders_pending' => 0,
            'questions_pending' => 0,
            'reputation' => 'unknown',
            'last_sync' => date('c')
        ];
    } else {
        $data = [
            'status' => 'not_configured',
            'configured' => false,
            'message' => 'Integração Mercado Livre não configurada',
            'integration' => 'mercadolivre',
            'timestamp' => date('c')
        ];
    }

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
