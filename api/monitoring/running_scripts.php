<?php
// Monitoring - Running Scripts
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:running-scripts';
$CACHE_TTL = RedisConfig::TTL_REALTIME;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $running = $conn->query("SELECT id, job_name, job_type, description, last_execution, (SELECT COUNT(*) FROM sync_jobs_history WHERE job_id = sync_jobs.id AND status = 'running') as active_count FROM sync_jobs WHERE is_deleted = 0 AND is_running = 1 ORDER BY last_execution DESC")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['scripts' => $running, 'count' => count($running)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
