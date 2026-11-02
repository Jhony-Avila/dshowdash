<?php
// Status Activity API - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do sistema
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:activity';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $uptime = shell_exec('uptime -p') ?: 'N/A';
    $load = sys_getloadavg();

    $data = [
        'status' => 'online',
        'configured' => true,
        'uptime' => trim($uptime),
        'usage' => round($load[0] * 10, 1) . '%',
        'load' => ['1min' => $load[0], '5min' => $load[1], '15min' => $load[2]],
        'details' => 'Sistema operando normalmente. Load médio: ' . round($load[1], 2),
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
