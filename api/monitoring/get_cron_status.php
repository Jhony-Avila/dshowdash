<?php
// Monitoring - Get Cron Status
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:cron-status';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $jobs = $conn->query("SELECT id, job_name, job_type, description, is_active, is_running, cron_expression, last_execution, last_success, next_execution, success_rate, error_count, total_executions FROM sync_jobs WHERE is_deleted = 0 ORDER BY job_name")->fetchAll(PDO::FETCH_ASSOC);
    $stats = ['total' => count($jobs), 'active' => 0, 'running' => 0, 'with_errors' => 0];
    foreach ($jobs as $job) { if ($job['is_active']) $stats['active']++; if ($job['is_running']) $stats['running']++; if ($job['error_count'] > 0) $stats['with_errors']++; }
    $output = ApiResponse::buildSuccess(['jobs' => $jobs, 'stats' => $stats], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
