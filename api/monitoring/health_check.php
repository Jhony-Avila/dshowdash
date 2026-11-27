<?php
// Monitoring - Health Check
// @version 3.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../../config/db_connection.php';
// FIX 2026-07-20: faltava este require. A linha 38 usa ApiResponse::buildSuccess()
// e o endpoint estourava "Class ApiResponse not found" (HTTP 500) desde 2026-01-25.
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => true]);

$checks = [];
$status = 'HEALTHY';

try {
    $pdo = getConnection('DSHOWDASH');
    $stmt = $pdo->query("SELECT 1");
    $checks['database'] = ['status' => 'OK', 'latency_ms' => 0];
} catch (Exception $e) {
    $checks['database'] = ['status' => 'ERROR', 'message' => 'Connection failed'];
    $status = 'UNHEALTHY';
}

$redisTest = RedisConfig::testConnection();
if ($redisTest['ok']) {
    $checks['redis'] = ['status' => 'OK', 'version' => $redisTest['version'] ?? 'unknown'];
} else {
    $checks['redis'] = ['status' => 'DEGRADED', 'message' => $redisTest['error'] ?? 'Redis unavailable'];
    if ($status === 'HEALTHY') $status = 'DEGRADED';
}

require_once __DIR__ . '/../core/DiscoSaude.php';
$diskFree = disk_free_space('/');
$diskTotal = disk_total_space('/');
[$diskUsedPercent, $nivel] = DiscoSaude::medir($diskTotal, $diskFree);
$checks['disk'] = ['status' => $nivel === 'online' ? 'OK' : strtoupper($nivel), 'used_percent' => $diskUsedPercent];
if ($nivel === 'critical') $status = 'UNHEALTHY';
elseif ($nivel !== 'online' && $status === 'HEALTHY') $status = 'DEGRADED';

header('Content-Type: application/json');
echo ApiResponse::buildSuccess(['status' => $status, 'checks' => $checks], ['version' => '3.3.0-P06-ENTERPRISE']);
