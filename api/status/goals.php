<?php
// Status Goals API - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P0.1 FIX: Usa CorsPolicy como fonte única
// P2.2 FIX: Redis isolado em helper
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:goals';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $isConfigured = false;

    if ($isConfigured) {
        $data = [
            'status' => 'online',
            'configured' => true,
            'completed' => 0,
            'pending' => 0,
            'details' => 'Metas em acompanhamento',
            'timestamp' => date('c')
        ];
    } else {
        $data = [
            'status' => 'not_configured',
            'configured' => false,
            'message' => 'Sistema de metas não configurado',
            'integration' => 'goals',
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
