<?php
// Status Server API - v3.2.0-ENTERPRISE
// v3.2.0: Adicionado try-catch error handling
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do sistema
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:server';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $uptime = shell_exec('uptime -p') ?: 'N/A';
    $hostname = gethostname();
    $load = sys_getloadavg();
    $usage = round($load[0] * 10, 1);

    $data = [
        'status' => 'online',
        'configured' => true,
        'hostname' => $hostname,
        'uptime' => trim($uptime),
        'usage' => $usage . '%',
        'php_version' => PHP_VERSION,
        'details' => 'Servidor ' . $hostname . ' operando normalmente.',
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
