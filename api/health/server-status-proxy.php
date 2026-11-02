<?php
// Server Status Proxy
// @version 2.4.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'health:server-status-proxy';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $uptime = trim(shell_exec('uptime -p') ?? 'unknown');
    $data = [
        'server' => ['hostname' => gethostname(), 'os' => php_uname('s'), 'kernel' => php_uname('r'), 'uptime' => $uptime],
        'php' => ['version' => PHP_VERSION, 'memory_limit' => ini_get('memory_limit'), 'max_execution_time' => ini_get('max_execution_time')],
        'load' => sys_getloadavg(),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.4.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
