<?php
// Monitoring - Get Cron Jobs Status
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:cron-jobs-status';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $jobs = $conn->query("SELECT id, job_name, job_type, is_active, is_running, cron_expression, last_execution, last_success, next_execution, success_rate, error_count FROM sync_jobs WHERE is_deleted = 0 AND cron_expression IS NOT NULL ORDER BY next_execution ASC")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['jobs' => $jobs, 'total' => count($jobs)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
