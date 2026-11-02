<?php
// Pipedrive Integration Status - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data, retorna status real de configuração
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:pipedrive';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    // TODO: Quando implementar integração real, verificar ENV ou config
    $isConfigured = false;

    if ($isConfigured) {
        $data = ['status' => 'online', 'configured' => true, 'deals_open' => 0, 'deals_won_month' => 0, 'pipeline_value' => 'R$ 0', 'last_sync' => date('Y-m-d H:i:s')];
    } else {
        $data = ['status' => 'not_configured', 'configured' => false, 'message' => 'Integração Pipedrive não configurada', 'integration' => 'pipedrive', 'timestamp' => date('Y-m-d H:i:s')];
    }

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
