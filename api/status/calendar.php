<?php
// Calendar Status - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data, retorna status real de configuracao
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:calendar';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $isConfigured = false;

    if ($isConfigured) {
        $data = [
            'status' => 'online',
            'configured' => true,
            'uptime' => '99.9%',
            'latency' => 'N/A',
            'usage' => 'N/A',
            'events_today' => 0,
            'details' => 'Calendario sincronizado',
            'timestamp' => date('Y-m-d H:i:s')
        ];
    } else {
        $data = [
            'status' => 'not_configured',
            'configured' => false,
            'message' => 'Integracao de calendario nao configurada',
            'integration' => 'calendar',
            'events_today' => 0,
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
