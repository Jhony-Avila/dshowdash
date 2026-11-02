<?php
// Server Health API
// @version 3.2.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);

function isInternalIp(string $ip): bool {
    $privateRanges = [
        ['start' => ip2long('10.0.0.0'), 'end' => ip2long('10.255.255.255')],
        ['start' => ip2long('172.16.0.0'), 'end' => ip2long('172.31.255.255')],
        ['start' => ip2long('192.168.0.0'), 'end' => ip2long('192.168.255.255')],
        ['start' => ip2long('127.0.0.0'), 'end' => ip2long('127.255.255.255')],
    ];
    $ipLong = ip2long($ip);
    if ($ipLong === false) return false;
    foreach ($privateRanges as $range) { if ($ipLong >= $range['start'] && $ipLong <= $range['end']) return true; }
    return $ip === '::1';
}

$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (strpos($clientIp, ',') !== false) $clientIp = trim(explode(',', $clientIp)[0]);

if (!isInternalIp($clientIp)) {
    header('Content-Type: application/json');
    echo json_encode(['ok' => true, 'data' => ['status' => 'online'], 'meta' => ['timestamp' => date('c')]]);
    exit;
}

$startTime = microtime(true);
$cpuLoad = sys_getloadavg();
$cpuCores = (int)shell_exec('nproc') ?: 1;
$memInfo = @file_get_contents('/proc/meminfo');
$memTotal = $memAvailable = 0;
if ($memInfo) {
    preg_match('/MemTotal:\s+(\d+)/', $memInfo, $total);
    preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $available);
    $memTotal = isset($total[1]) ? (int)$total[1] : 0;
    $memAvailable = isset($available[1]) ? (int)$available[1] : 0;
}
$diskFree = disk_free_space('/');
$diskTotal = disk_total_space('/');
$uptime = @file_get_contents('/proc/uptime');
$uptimeSeconds = $uptime ? (int)explode(' ', $uptime)[0] : 0;
$responseTime = round((microtime(true) - $startTime) * 1000, 2);

header('Content-Type: application/json');
echo json_encode([
    'ok' => true,
    'data' => [
        'status' => 'online', 'uptime_seconds' => $uptimeSeconds, 'uptime_formatted' => gmdate('H:i:s', $uptimeSeconds),
        'cpu' => ['load_1m' => $cpuLoad[0] ?? 0, 'load_5m' => $cpuLoad[1] ?? 0, 'load_15m' => $cpuLoad[2] ?? 0, 'cores' => $cpuCores],
        'memory' => ['total_mb' => round($memTotal / 1024, 0), 'available_mb' => round($memAvailable / 1024, 0), 'used_percent' => $memTotal > 0 ? round((1 - ($memAvailable / $memTotal)) * 100, 1) : 0],
        'disk' => ['total_gb' => round($diskTotal / 1073741824, 2), 'free_gb' => round($diskFree / 1073741824, 2), 'used_percent' => round((1 - ($diskFree / $diskTotal)) * 100, 1)],
        'php_version' => PHP_VERSION, 'response_time_ms' => $responseTime
    ],
    'meta' => ['version' => '3.2.0-P06-ENTERPRISE', 'timestamp' => date('c')]
], JSON_UNESCAPED_UNICODE);
