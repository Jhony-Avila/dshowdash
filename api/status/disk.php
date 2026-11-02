<?php
// Status Disk API - v4.1.0-ENTERPRISE
// v4.1.0: Adicionado try-catch error handling
// v4.0.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do sistema
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';

$CACHE_KEY = 'status:disk';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $total = disk_total_space('/');
    $free = disk_free_space('/');
    $used = $total - $free;
    $usage = round(($used / $total) * 100, 1);

    $data = [
        'status' => $usage < 80 ? 'online' : ($usage < 95 ? 'warning' : 'critical'),
        'configured' => true,
        'uptime' => '99.9%',
        'usage' => $usage . '%',
        'total' => round($total / 1024 / 1024 / 1024) . 'GB',
        'used' => round($used / 1024 / 1024 / 1024) . 'GB',
        'free' => round($free / 1024 / 1024 / 1024) . 'GB',
        'details' => "Disco: {$usage}% usado (" . round($used / 1024 / 1024 / 1024) . "GB / " . round($total / 1024 / 1024 / 1024) . "GB)",
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
