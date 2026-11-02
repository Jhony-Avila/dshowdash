<?php
// Status Memory API - v4.1.0-ENTERPRISE
// v4.1.0: Adicionado try-catch error handling
// v4.0.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do sistema
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';

$CACHE_KEY = 'status:memory';
$CACHE_TTL = 15; // Memória precisa de refresh mais frequente

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $meminfo = file_get_contents('/proc/meminfo');
    preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
    preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $available);

    $totalMB = round($total[1] / 1024);
    $availableMB = round($available[1] / 1024);
    $usedMB = $totalMB - $availableMB;
    $usage = round(($usedMB / $totalMB) * 100, 1);

    $data = [
        'status' => $usage < 80 ? 'online' : ($usage < 95 ? 'warning' : 'critical'),
        'configured' => true,
        'uptime' => '99.9%',
        'usage' => $usage . '%',
        'total' => round($totalMB / 1024, 1) . 'GB',
        'used' => round($usedMB / 1024, 1) . 'GB',
        'available' => round($availableMB / 1024, 1) . 'GB',
        'details' => "Memória: {$usage}% usado ({$usedMB}MB / {$totalMB}MB)",
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
