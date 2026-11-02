<?php
// Monitoring - Get Cron Frequencies
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:cron-frequencies';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $frequencies = $conn->query("SELECT cron_expression, COUNT(*) as job_count FROM sync_jobs WHERE is_deleted = 0 AND cron_expression IS NOT NULL GROUP BY cron_expression ORDER BY job_count DESC")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['frequencies' => $frequencies, 'total' => count($frequencies)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
