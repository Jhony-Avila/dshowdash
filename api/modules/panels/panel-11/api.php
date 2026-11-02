<?php
declare(strict_types=1);
// Panel-11 API - Resumo Geral Enterprise
// @version 7.4.0-P06-ENTERPRISE
// @changelog v7.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$cacheKey = 'panel:11:summary:v7';
$cacheTTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($cacheKey)) { exit; }

require_once '/opt/dshow_secure/config/database.php';

try {
    $summary30d = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error, SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout, AVG(execution_time_seconds) as avg_time FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetch(PDO::FETCH_ASSOC);
    $summaryPrev = $pdo->query("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND execution_start < DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetch(PDO::FETCH_ASSOC);
    $jobsCount = $pdo->query("SELECT COUNT(DISTINCT job_name) as total FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetch(PDO::FETCH_ASSOC);
    $avgRate = $pdo->query("SELECT AVG(success_rate) as avg_rate FROM (SELECT job_name, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100 as success_rate FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY job_name) as rates")->fetch(PDO::FETCH_ASSOC);
    $trend30Days = $pdo->query("SELECT DATE(execution_start) as date, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error, ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate FROM sync_jobs_history WHERE execution_start >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY DATE(execution_start) ORDER BY date ASC")->fetchAll(PDO::FETCH_ASSOC);
    $topErrors = $pdo->query("SELECT job_name, COUNT(*) as total_executions, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors, ROUND(SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as error_rate FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY job_name HAVING errors > 0 ORDER BY errors DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    $hourlyDist = $pdo->query("SELECT HOUR(execution_start) as hour, COUNT(*) as total, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY hour ORDER BY hour ASC")->fetchAll(PDO::FETCH_ASSOC);
    $weekdayDist = $pdo->query("SELECT DAYOFWEEK(execution_start) as dow, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as success_rate FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY dow ORDER BY dow ASC")->fetchAll(PDO::FETCH_ASSOC);
    $sparkline = $pdo->query("SELECT DATE_FORMAT(execution_start, '%H') as hour, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY hour ORDER BY hour ASC")->fetchAll(PDO::FETCH_ASSOC);

    $calcChange = fn($old, $new) => ((float)$old == 0) ? ((float)$new > 0 ? 100.0 : 0.0) : round((((float)$new - (float)$old) / (float)$old) * 100, 2);
    $alertsTotal = (int)$summary30d['error'] + (int)$summary30d['timeout'];

    $output = ApiResponse::buildSuccess([
        'report_type' => 'summary',
        'period' => ['from' => date('Y-m-d', strtotime('-30 days')), 'to' => date('Y-m-d')],
        'data' => [
            'executions' => ['total' => (int)$summary30d['total'], 'success' => (int)$summary30d['success'], 'error' => (int)$summary30d['error'], 'timeout' => (int)$summary30d['timeout'], 'avg_time' => round((float)($summary30d['avg_time'] ?? 0), 2)],
            'jobs' => ['total' => (int)$jobsCount['total'], 'avg_success_rate' => round((float)($avgRate['avg_rate'] ?? 0), 2)],
            'alerts' => ['total' => $alertsTotal]
        ],
        'comparison' => [
            'current_total' => (int)$summary30d['total'], 'previous_total' => (int)$summaryPrev['total'], 'change_total' => $calcChange($summaryPrev['total'], $summary30d['total']),
            'current_success' => (int)$summary30d['success'], 'previous_success' => (int)$summaryPrev['success'], 'change_success' => $calcChange($summaryPrev['success'], $summary30d['success']),
            'current_errors' => (int)$summary30d['error'], 'previous_errors' => (int)$summaryPrev['error'], 'change_errors' => $calcChange($summaryPrev['error'], $summary30d['error'])
        ],
        'trend_30_days' => $trend30Days, 'top_errors' => $topErrors, 'hourly_distribution' => $hourlyDist, 'weekday_distribution' => $weekdayDist,
        'sparkline' => ['total' => array_column($sparkline, 'total'), 'success' => array_column($sparkline, 'success')],
        'generated_at' => date('Y-m-d H:i:s')
    ], ['version' => '7.4.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($cacheKey, $output, $cacheTTL);

} catch (Throwable $e) {
    RedisHelper::close();
    error_log("panel-11 error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
