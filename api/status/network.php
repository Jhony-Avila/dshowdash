<?php
// Status Network API - v4.1.0-ENTERPRISE
// v4.1.0: Adicionado try-catch error handling
// v4.0.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';

$CACHE_KEY = 'status:network';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $isConfigured = false;

    if ($isConfigured) {
        $data = [
            'status' => 'online',
            'configured' => true,
            'uptime' => '99.9%',
            'details' => 'Rede operando normalmente',
            'timestamp' => date('Y-m-d H:i:s')
        ];
    } else {
        $data = [
            'status' => 'not_configured',
            'configured' => false,
            'message' => 'Monitoramento de rede não configurado',
            'integration' => 'network',
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
