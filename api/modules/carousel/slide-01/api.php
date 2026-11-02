<?php
// Carousel Slide 01 - Performance Geral
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'carousel:slide-01';
$CACHE_TTL = 300;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $dateFrom = date('Y-m-d', strtotime('-30 days'));
    $dateTo = date('Y-m-d');

    $current = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count FROM sync_jobs_history WHERE DATE(execution_start) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)")->fetch(PDO::FETCH_ASSOC);
    $currentRate = $current['total'] > 0 ? round(($current['success_count'] / $current['total']) * 100, 2) : 0;

    $today = $conn->query("SELECT COUNT(*) as total_today FROM sync_jobs_history WHERE DATE(execution_start) = CURDATE()")->fetch(PDO::FETCH_ASSOC);

    $stmtTrend = $conn->prepare("SELECT DATE(execution_start) as date, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count, ROUND((SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as success_rate FROM sync_jobs_history WHERE DATE(execution_start) BETWEEN :dateFrom AND :dateTo GROUP BY DATE(execution_start) ORDER BY date ASC");
    $stmtTrend->execute(['dateFrom' => $dateFrom, 'dateTo' => $dateTo]);
    $trend = $stmtTrend->fetchAll(PDO::FETCH_ASSOC);

    $targetRate = 99.5;
    $data = [
        'period' => ['from' => $dateFrom, 'to' => $dateTo, 'days' => 30],
        'current' => ['rate' => $currentRate, 'total' => (int)$current['total'], 'success_count' => (int)$current['success_count'], 'error_count' => (int)($current['total'] - $current['success_count'])],
        'today' => ['total' => (int)$today['total_today']],
        'target' => ['rate' => $targetRate, 'is_above' => $currentRate >= $targetRate, 'diff' => round($currentRate - $targetRate, 2)],
        'trend' => $trend
    ];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
