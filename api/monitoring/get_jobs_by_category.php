<?php
// Monitoring - Get Jobs By Category
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:jobs-by-category';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $categories = $conn->query("SELECT job_type as category, COUNT(*) as total, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active, SUM(CASE WHEN is_running = 1 THEN 1 ELSE 0 END) as running, AVG(success_rate) as avg_success_rate FROM sync_jobs WHERE is_deleted = 0 GROUP BY job_type ORDER BY total DESC")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['categories' => $categories, 'total_categories' => count($categories)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
