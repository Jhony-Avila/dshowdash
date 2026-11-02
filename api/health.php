<?php
// /api/health.php
// Health Check Endpoint - Sistema DshowDash
// @version 2.1.0-ENTERPRISE
// @updated 2026-01-21
// P3.2: Adicionado IP whitelist para proteger informações sensíveis
// P2.1: Migrado para ApiResponse

require_once __DIR__ . '/_helpers/ApiResponse.php';

header('Cache-Control: no-cache, no-store, must-revalidate');

// IPs permitidos para visualização completa
$allowedIps = [
    '127.0.0.1',
    '::1',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
];

// IPs de monitoramento externos (adicionar conforme necessário)
$monitoringIps = getenv('HEALTH_ALLOWED_IPS') ? explode(',', getenv('HEALTH_ALLOWED_IPS')) : [];
$allowedIps = array_merge($allowedIps, $monitoringIps);

function isIpAllowed(string $ip, array $allowedRanges): bool {
    foreach ($allowedRanges as $range) {
        if (strpos($range, '/') !== false) {
            list($subnet, $mask) = explode('/', $range);
            if ((ip2long($ip) & ~((1 << (32 - $mask)) - 1)) === ip2long($subnet)) {
                return true;
            }
        } else {
            if ($ip === $range) {
                return true;
            }
        }
    }
    return false;
}

$clientIp = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? $_SERVER['HTTP_X_FORWARDED_FOR'] : (isset($_SERVER['HTTP_X_REAL_IP']) ? $_SERVER['HTTP_X_REAL_IP'] : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0'));
if (strpos($clientIp, ',') !== false) {
    $clientIp = trim(explode(',', $clientIp)[0]);
}

$isAuthorized = isIpAllowed($clientIp, $allowedIps);

// Para IPs não autorizados, retorna apenas status básico
if (!$isAuthorized) {
    $status = 'HEALTHY';
    
    try {
        require_once '/var/www/dshowdash/config/db_connection.php';
        $result = DatabaseManager::testConnection('DSHOWDASH');
        if (!$result['success']) {
            $status = 'UNHEALTHY';
        }
    } catch (Exception $e) {
        $status = 'UNHEALTHY';
    }

    if ($status === 'UNHEALTHY') {
        ApiResponse::error('UNHEALTHY', 503, [
            'status' => $status,
            'timestamp' => date('c'),
            'version' => '3.1.0-ENTERPRISE'
        ]);
    } else {
        ApiResponse::success([
            'status' => $status,
            'timestamp' => date('c'),
            'version' => '3.1.0-ENTERPRISE'
        ]);
    }
    exit;
}

// Resposta completa para IPs autorizados
$startTime = microtime(true);

$health = [
    'status' => 'HEALTHY',
    'timestamp' => date('c'),
    'version' => '3.1.0-ENTERPRISE',
    'environment' => 'production',
    'checks' => [],
    'metrics' => []
];

// 1. PHP Status
$health['checks']['php'] = [
    'status' => 'OK',
    'version' => PHP_VERSION,
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time')
];

// 2. Session Status
try {
    require_once __DIR__ . '/_session_init.php';
    $health['checks']['session'] = [
        'status' => session_status() === PHP_SESSION_ACTIVE ? 'OK' : 'DEGRADED',
        'save_path' => session_save_path(),
        'name' => session_name()
    ];
} catch (Exception $e) {
    $health['checks']['session'] = ['status' => 'ERROR'];
    $health['status'] = 'DEGRADED';
    error_log('health.php session error: ' . $e->getMessage());
}

// 3. Database Connection
try {
    require_once '/var/www/dshowdash/config/db_connection.php';
    $result = DatabaseManager::testConnection('DSHOWDASH');
    if ($result['success']) {
        $health['checks']['database'] = [
            'status' => 'OK',
            'database' => 'DSHOWDASH',
            'server_time' => $result['server_time']
        ];
    } else {
        $health['checks']['database'] = ['status' => 'ERROR'];
        $health['status'] = 'UNHEALTHY';
    }
} catch (Exception $e) {
    $health['checks']['database'] = ['status' => 'ERROR'];
    $health['status'] = 'UNHEALTHY';
    error_log('health.php database error: ' . $e->getMessage());
}

// 3b. Bancos REMOTOS (2026-09-15, incidente displaysolutions): sonda TCP de 2s no host:porta de cada banco
// remoto, sem PDO (nao paga os 3 x 10s do retry) e sem derrubar o health (DEGRADED, HTTP 200 — o deploy-as5
// exige 200). Tambem informa se o circuit breaker do DatabaseManager esta aberto para o banco.
$health['checks']['remote_databases'] = ['status' => 'OK'];
foreach (['INTEGRACAO', 'DSHOW_PROD'] as $rdb) {
    $rhost = getenv('DB_' . $rdb . '_HOST') ?: 'displaysolutions.com.br';
    $rport = (int)(getenv('DB_' . $rdb . '_PORT') ?: 3306);
    $t0 = microtime(true);
    $errno = 0; $errstr = '';
    $sock = @fsockopen($rhost, $rport, $errno, $errstr, 2.0);
    $up = $sock !== false;
    if ($sock) fclose($sock);
    $entry = ['status' => $up ? 'OK' : 'DOWN', 'host' => $rhost, 'port' => $rport, 'probe_ms' => round((microtime(true) - $t0) * 1000, 1)];
    if (!$up) $entry['error'] = trim((string)$errstr) !== '' ? trim((string)$errstr) : ('errno ' . (int)$errno);
    if (class_exists('DatabaseManager') && method_exists('DatabaseManager', 'isCircuitOpen')) {
        $entry['circuit_open'] = DatabaseManager::isCircuitOpen($rdb);
    }
    $health['checks']['remote_databases'][$rdb] = $entry;
    if (!$up) {
        $health['checks']['remote_databases']['status'] = 'DOWN';
        if ($health['status'] === 'HEALTHY') $health['status'] = 'DEGRADED';
    }
}

// 4. Disk Space
$diskFree = disk_free_space('/');
$diskTotal = disk_total_space('/');
$diskUsedPercent = round((1 - ($diskFree / $diskTotal)) * 100, 1);
$health['checks']['disk'] = [
    'status' => $diskUsedPercent < 90 ? 'OK' : ($diskUsedPercent < 95 ? 'WARNING' : 'CRITICAL'),
    'used_percent' => $diskUsedPercent,
    'free_gb' => round($diskFree / 1073741824, 2),
    'total_gb' => round($diskTotal / 1073741824, 2)
];
if ($diskUsedPercent >= 95) $health['status'] = 'UNHEALTHY';

// 5. Memory
$memInfo = @file_get_contents('/proc/meminfo');
if ($memInfo) {
    preg_match('/MemTotal:\s+(\d+)/', $memInfo, $total);
    preg_match('/MemAvailable:\s+(\d+)/', $memInfo, $available);
    if (!empty($total[1]) && !empty($available[1])) {
        $memUsedPercent = round((1 - ($available[1] / $total[1])) * 100, 1);
        $health['checks']['memory'] = [
            'status' => $memUsedPercent < 85 ? 'OK' : ($memUsedPercent < 95 ? 'WARNING' : 'CRITICAL'),
            'used_percent' => $memUsedPercent,
            'available_mb' => round($available[1] / 1024, 0),
            'total_mb' => round($total[1] / 1024, 0)
        ];
    }
}

// 6. Key directories
$dirs = [
    'public' => '/var/www/dshowdash/public',
    'backup' => '/backup',
    'logs' => '/var/www/dshowdash/storage/logs'
];
$health['checks']['directories'] = ['status' => 'OK'];
foreach ($dirs as $name => $path) {
    $exists = is_dir($path);
    $writable = is_writable($path);
    $health['checks']['directories'][$name] = ['exists' => $exists, 'writable' => $writable];
    if (!$exists) $health['checks']['directories']['status'] = 'DEGRADED';
}

// 7. Redis Status
try {
    require_once __DIR__ . '/core/helpers/RedisHelper.php';
    $redis = RedisHelper::getInstance();
    if ($redis) {
        $redisInfo = $redis->info('server');
        $health['checks']['redis'] = [
            'status' => 'OK',
            'version' => $redisInfo['redis_version'] ?? 'unknown',
            'uptime_seconds' => (int)($redisInfo['uptime_in_seconds'] ?? 0),
            'connected_clients' => (int)(($redis->info('clients')['connected_clients']) ?? 0),
        ];
        RedisHelper::close();
    } else {
        $health['checks']['redis'] = ['status' => 'ERROR', 'message' => 'Connection failed'];
        $health['status'] = 'DEGRADED';
    }
} catch (Exception $e) {
    $health['checks']['redis'] = ['status' => 'ERROR', 'message' => $e->getMessage()];
    $health['status'] = 'DEGRADED';
    error_log('health.php redis error: ' . $e->getMessage());
}

// 8. Navigation item counts by table
try {
    $navTables = [
        'ui_nav_items' => "SELECT COUNT(*) AS cnt FROM ui_nav_items WHERE item_type != 'group'",
        'navrail_items' => "SELECT COUNT(*) AS cnt FROM navrail_items",
        'header_components' => "SELECT COUNT(*) AS cnt FROM header_components",
        'footer_items' => "SELECT COUNT(*) AS cnt FROM footer_items",
    ];
    $navCounts = [];
    $navTotal = 0;
    // Reuse DB connection from check #3
    if (isset($result) && $result['success']) {
        $pdo = DatabaseManager::getConnection('DSHOWDASH');
        foreach ($navTables as $tbl => $sql) {
            try {
                $row = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
                $count = (int)($row['cnt'] ?? 0);
                $navCounts[$tbl] = $count;
                $navTotal += $count;
            } catch (Exception $e) {
                $navCounts[$tbl] = -1;
            }
        }
    }
    $health['checks']['navigation'] = [
        'status' => 'OK',
        'total_items' => $navTotal,
        'by_table' => $navCounts,
    ];
} catch (Exception $e) {
    $health['checks']['navigation'] = ['status' => 'ERROR'];
    error_log('health.php navigation count error: ' . $e->getMessage());
}

// 9. Last manifest rebuild
$manifestPath = '/var/www/dshowdash/public/core/ui-orchestrator/registry/manifest-generated.js';
if (file_exists($manifestPath)) {
    $mtime = filemtime($manifestPath);
    $health['checks']['manifest'] = [
        'status' => 'OK',
        'last_rebuild' => date('c', $mtime),
        'age_seconds' => time() - $mtime,
        'size_kb' => round(filesize($manifestPath) / 1024, 1),
    ];
} else {
    $health['checks']['manifest'] = [
        'status' => 'WARNING',
        'message' => 'Manifest file not found',
    ];
}

// Metrics
$health['metrics']['response_time_ms'] = round((microtime(true) - $startTime) * 1000, 2);
$health['metrics']['memory_usage_mb'] = round(memory_get_usage(true) / 1048576, 2);

// Final score
$okCount = 0;
$totalChecks = 0;
foreach ($health['checks'] as $check) {
    if (isset($check['status'])) {
        $totalChecks++;
        if ($check['status'] === 'OK') $okCount++;
    }
}
$health['score'] = "{$okCount}/{$totalChecks}";

if ($health['status'] === 'UNHEALTHY') {
    ApiResponse::error('UNHEALTHY', 503, $health);
} else {
    ApiResponse::success($health);
}
