<?php
// Health Status API Enterprise
// @version 2.4.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'METHOD_NOT_ALLOWED']);
    exit;
}

function isInternalIpCheck(string $ip): bool {
    $privateRanges = [
        ['start' => ip2long('10.0.0.0'), 'end' => ip2long('10.255.255.255')],
        ['start' => ip2long('172.16.0.0'), 'end' => ip2long('172.31.255.255')],
        ['start' => ip2long('192.168.0.0'), 'end' => ip2long('192.168.255.255')],
        ['start' => ip2long('127.0.0.0'), 'end' => ip2long('127.255.255.255')],
    ];
    $ipLong = ip2long($ip);
    if ($ipLong === false) return false;
    foreach ($privateRanges as $range) {
        if ($ipLong >= $range['start'] && $ipLong <= $range['end']) return true;
    }
    return $ip === '::1';
}

$clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (strpos($clientIp, ',') !== false) $clientIp = trim(explode(',', $clientIp)[0]);

if (!isInternalIpCheck($clientIp)) {
    echo json_encode(['ok' => true, 'data' => ['status' => 'healthy', 'timestamp' => date('c')]]);
    exit;
}

$CACHE_KEY = 'health:status';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    require_once '/var/www/dshowdash/app/config/database.php';

    $status = 'healthy';
    $checks = [];
    $response_time_start = microtime(true);

    $db_status = 'unknown';
    $db_latency = null;
    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $db_start = microtime(true);
            $stmt = $pdo->query('SELECT 1');
            $db_latency = round((microtime(true) - $db_start) * 1000, 2);
            $db_status = $stmt ? 'healthy' : 'degraded';
            if ($db_status === 'degraded') $status = 'degraded';
        } catch (PDOException $e) {
            $db_status = 'unhealthy';
            $status = 'unhealthy';
        }
    } else {
        $db_status = 'unavailable';
        $status = 'degraded';
    }
    $checks['database'] = ['status' => $db_status, 'latency_ms' => $db_latency];

    $disk_free = disk_free_space('/');
    $disk_total = disk_total_space('/');
    $disk_used_pct = round((1 - ($disk_free / $disk_total)) * 100, 2);
    $disk_status = 'healthy';
    if ($disk_used_pct > 90) { $disk_status = 'critical'; $status = 'unhealthy'; }
    elseif ($disk_used_pct > 80) { $disk_status = 'warning'; if ($status === 'healthy') $status = 'degraded'; }
    $checks['disk'] = ['status' => $disk_status, 'used_percent' => $disk_used_pct, 'free_gb' => round($disk_free / (1024 ** 3), 2)];

    $memory_used = memory_get_usage(true);
    $memory_peak = memory_get_peak_usage(true);
    $checks['memory'] = ['status' => 'healthy', 'used_mb' => round($memory_used / (1024 ** 2), 2), 'peak_mb' => round($memory_peak / (1024 ** 2), 2)];

    $php_status = version_compare(PHP_VERSION, '8.0.0', '>=') ? 'healthy' : 'warning';
    $checks['php'] = ['status' => $php_status, 'version' => PHP_VERSION];

    $required = ['pdo', 'pdo_mysql', 'json', 'mbstring', 'curl', 'redis'];
    $missing = array_filter($required, fn($ext) => !extension_loaded($ext));
    $checks['extensions'] = ['status' => empty($missing) ? 'healthy' : 'warning', 'missing' => array_values($missing)];

    $response_time_ms = round((microtime(true) - $response_time_start) * 1000, 2);

    $result = [
        'status' => $status,
        'timestamp' => date('c'),
        'response_time_ms' => $response_time_ms,
        'checks' => $checks,
        'server' => ['hostname' => gethostname()],
        'version' => '2.4.0-P06-ENTERPRISE'
    ];

    $http_code = $status === 'unhealthy' ? 503 : 200;
    http_response_code($http_code);

    $output = json_encode(['ok' => $status !== 'unhealthy', 'data' => $result], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($status !== 'unhealthy') {
        RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
    } else {
        echo $output;
        RedisHelper::close();
    }

} catch (Exception $e) {
    RedisHelper::close();
    http_response_code(503);
    echo json_encode(['ok' => false, 'data' => ['status' => 'unhealthy'], 'error' => 'INTERNAL_ERROR', 'timestamp' => date('c')]);
}
