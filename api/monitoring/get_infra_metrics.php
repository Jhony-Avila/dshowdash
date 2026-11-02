<?php
// Monitoring - Get Infra Metrics
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:infra-metrics';
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
        $memTotal = isset($t[1]) ? (int)$t[1] : 0;
        $memAvailable = isset($a[1]) ? (int)$a[1] : 0;
    }
    $diskTotal = disk_total_space('/');
    $diskFree = disk_free_space('/');
    $uptime = @file_get_contents('/proc/uptime');
    $uptimeSec = $uptime ? (int)explode(' ', $uptime)[0] : 0;
    $data = [
        'cpu' => ['load_1m' => $load[0], 'load_5m' => $load[1], 'load_15m' => $load[2], 'cores' => $cpus, 'usage_pct' => round(($load[0] / $cpus) * 100, 2)],
        'memory' => ['total_mb' => round($memTotal / 1024), 'available_mb' => round($memAvailable / 1024), 'usage_pct' => $memTotal > 0 ? round((1 - $memAvailable / $memTotal) * 100, 2) : 0],
        'disk' => ['total_gb' => round($diskTotal / (1024**3), 2), 'free_gb' => round($diskFree / (1024**3), 2), 'usage_pct' => round((1 - $diskFree / $diskTotal) * 100, 2)],
        'uptime' => ['seconds' => $uptimeSec, 'days' => floor($uptimeSec / 86400)],
        'hostname' => gethostname()
    ];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
