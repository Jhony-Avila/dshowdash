<?php
// Health Heatmap API
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$days = min((int)($_GET['days'] ?? 7), 30);
$CACHE_KEY = "health:heatmap:{$days}";
$CACHE_TTL = 300;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $heatmap = [];
    $stmt = $conn->query("SELECT DATE(execution_start) as date, HOUR(execution_start) as hour, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors FROM sync_jobs_history WHERE execution_start >= DATE_SUB(CURDATE(), INTERVAL {$days} DAY) GROUP BY date, hour ORDER BY date, hour");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $heatmap[] = ['date' => $row['date'], 'hour' => (int)$row['hour'], 'total' => (int)$row['total'], 'success' => (int)$row['success'], 'errors' => (int)$row['errors'], 'success_rate' => $row['total'] > 0 ? round(($row['success'] / $row['total']) * 100, 2) : 0];
    }
    $output = ApiResponse::buildSuccess(['heatmap' => $heatmap, 'days' => $days], ['rows_affected' => count($heatmap), 'version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
