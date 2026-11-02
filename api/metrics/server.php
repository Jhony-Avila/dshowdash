<?php
// Metrics Server
// @version 4.2.2-FIX
// @changelog v4.2.2-FIX - Adicionado logging explícito no catch
// @changelog v4.2.1-FIX - Adicionado require ApiResponse.php

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'HEAD', 'OPTIONS']]);
header('Cache-Control: no-store');

$CACHE_KEY = 'metrics:server';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

function getCpuUsage() {
    $load = sys_getloadavg();
    if (!$load) return null;
    $cores = (int)shell_exec('nproc 2>/dev/null') ?: 1;
    return min(100, max(0, round(($load[0] / $cores) * 100, 1)));
}

function getDiskUsage() {
    $total = @disk_total_space('/');
    $free = @disk_free_space('/');
    if (!$total || !$free) return null;
    return round((($total - $free) / $total) * 100, 1);
}

function getMemoryUsage() {
    $meminfo = @file_get_contents('/proc/meminfo');
    if (!$meminfo) return null;
    preg_match('/MemTotal:\s+(\d+)/', $meminfo, $total);
    preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $available);
    if (empty($total[1]) || empty($available[1])) return null;
    $used = (int)$total[1] - (int)$available[1];
    return round(($used / (int)$total[1]) * 100, 1);
}

try {
    $data = ['cpu' => getCpuUsage(), 'disk' => getDiskUsage(), 'memory' => getMemoryUsage(), 'timestamp' => date('c'), 'server' => gethostname() ?: 'unknown'];
    $output = ApiResponse::buildSuccess($data, ['version' => '4.2.1-FIX']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("[metrics:server] Exception: " . $e->getMessage() . " | File: " . $e->getFile() . ":" . $e->getLine() . " | Trace: " . $e->getTraceAsString());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
