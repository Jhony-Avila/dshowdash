<?php
// Status CPU API - v4.1.0-ENTERPRISE
// v4.1.0: Adicionado try-catch error handling
// v4.0.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do sistema
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';

$CACHE_KEY = 'status:cpu';
$CACHE_TTL = 15; // CPU precisa de refresh mais frequente

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $load = sys_getloadavg();
    $cores = (int)shell_exec('nproc') ?: 1;
    $usage = round(($load[0] / $cores) * 100, 1);

    $data = [
        'status' => $usage < 80 ? 'online' : ($usage < 95 ? 'warning' : 'critical'),
        'configured' => true,
        'uptime' => trim(shell_exec('uptime -p') ?: 'N/A'),
        'usage' => $usage . '%',
        'cores' => $cores,
        'load' => ['1min' => $load[0], '5min' => $load[1], '15min' => $load[2]],
        'details' => "CPU: {$usage}% usado, {$cores} cores, Load: {$load[0]}",
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("Status endpoint error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess(['error' => 'SERVICE_UNAVAILABLE', 'status' => 'error']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, 60);
}
