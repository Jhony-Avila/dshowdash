<?php
// Monitoring - Metrics Enterprise
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:metrics';
$CACHE_TTL = 60;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $jobs = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active, SUM(CASE WHEN is_running = 1 THEN 1 ELSE 0 END) as running, SUM(CASE WHEN error_count > 0 THEN 1 ELSE 0 END) as with_errors, AVG(success_rate) as avg_success_rate FROM sync_jobs WHERE is_deleted = 0")->fetch(PDO::FETCH_ASSOC);

    $exec_24h = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors, AVG(execution_time_seconds) as avg_time FROM sync_jobs_history WHERE execution_start > DATE_SUB(NOW(), INTERVAL 24 HOUR)")->fetch(PDO::FETCH_ASSOC);

    $exec_1h = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors FROM sync_jobs_history WHERE execution_start > DATE_SUB(NOW(), INTERVAL 1 HOUR)")->fetch(PDO::FETCH_ASSOC);

    $data = [
        'jobs' => $jobs,
        'executions_24h' => $exec_24h,
        'executions_1h' => $exec_1h,
        'success_rate_24h' => $exec_24h['total'] > 0 ? round(($exec_24h['success'] / $exec_24h['total']) * 100, 2) : 0
    ];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
