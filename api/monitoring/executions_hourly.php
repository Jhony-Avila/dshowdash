<?php
// Monitoring - Executions Hourly
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:executions-hourly';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $hourly = $conn->query("SELECT HOUR(execution_start) as hour, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors, AVG(execution_time_seconds) as avg_time FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY HOUR(execution_start) ORDER BY hour")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['hourly' => $hourly, 'period' => '24h'], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
