<?php
// Monitoring - Get Cron Jobs Minimal
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:cron-jobs-minimal';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $jobs = $conn->query("SELECT id, job_name, is_active, is_running, success_rate FROM sync_jobs WHERE is_deleted = 0 ORDER BY job_name")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['jobs' => $jobs, 'total' => count($jobs)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
