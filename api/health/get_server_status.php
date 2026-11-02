<?php
// Server Status API
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'health:server-status';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $load = sys_getloadavg();
    $cpus = (int)shell_exec('nproc') ?: 1;
    $meminfo = file_get_contents('/proc/meminfo');
    preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
    preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $available);
    $mem_total = isset($total[1]) ? round($total[1] / 1024, 2) : 0;
    $mem_available = isset($available[1]) ? round($available[1] / 1024, 2) : 0;
    $mem_used = $mem_total - $mem_available;
    $disk_total = disk_total_space('/');
    $disk_free = disk_free_space('/');
    $uptime = (int)explode(' ', file_get_contents('/proc/uptime'))[0];
    $days = floor($uptime / 86400);
    $hours = floor(($uptime % 86400) / 3600);

    $data = [
        'cpu' => ['load_1m' => $load[0], 'load_5m' => $load[1], 'load_15m' => $load[2], 'cores' => $cpus, 'percent' => round(($load[0] / $cpus) * 100, 2)],
        'memory' => ['total_mb' => $mem_total, 'used_mb' => $mem_used, 'available_mb' => $mem_available, 'percent' => round(($mem_used / $mem_total) * 100, 2)],
        'disk' => ['total_gb' => round($disk_total / (1024**3), 2), 'free_gb' => round($disk_free / (1024**3), 2), 'percent' => round((1 - $disk_free / $disk_total) * 100, 2)],
        'uptime' => ['seconds' => $uptime, 'text' => "{$days}d {$hours}h"],
        'hostname' => gethostname()
    ];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
