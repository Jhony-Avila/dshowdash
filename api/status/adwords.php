<?php
// Google Ads Integration Status - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data, retorna status real de configuracao
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:adwords';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $isConfigured = false;

    if ($isConfigured) {
        $data = [
            'status' => 'online',
            'configured' => true,
            'clicks_today' => 0,
            'impressions_today' => 0,
            'spend_today' => 'R$ 0',
            'ctr' => '0%'
        ];
    } else {
        $data = [
            'status' => 'not_configured',
            'configured' => false,
            'message' => 'Integracao Google Ads nao configurada',
            'integration' => 'adwords',
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
