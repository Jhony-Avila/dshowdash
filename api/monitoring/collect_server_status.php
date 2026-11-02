<?php
// Monitoring - Collect Server Status
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:server-status';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $load = sys_getloadavg();
    $cpus = (int)shell_exec('nproc') ?: 1;
    $meminfo = @file_get_contents('/proc/meminfo');
    $memTotal = $memAvailable = 0;
    if ($meminfo) {
        preg_match('/MemTotal:\s+(\d+)/', $meminfo, $t);
        preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $a);
        $memTotal = isset($t[1]) ? round($t[1] / 1024, 2) : 0;
        $memAvailable = isset($a[1]) ? round($a[1] / 1024, 2) : 0;
    }
    $diskTotal = disk_total_space('/');
    $diskFree = disk_free_space('/');
    $data = [
        'cpu' => ['load' => $load, 'cores' => $cpus, 'percent' => round(($load[0] / $cpus) * 100, 2)],
        'memory' => ['total_mb' => $memTotal, 'available_mb' => $memAvailable, 'used_mb' => $memTotal - $memAvailable, 'percent' => $memTotal > 0 ? round((($memTotal - $memAvailable) / $memTotal) * 100, 2) : 0],
        'disk' => ['total_gb' => round($diskTotal / (1024**3), 2), 'free_gb' => round($diskFree / (1024**3), 2), 'percent' => round((1 - $diskFree / $diskTotal) * 100, 2)],
        'hostname' => gethostname(),
        'timestamp' => date('c')
    ];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
