<?php
// Painel 14 - Top Erros Enterprise
// @version 3.3.0-P06-ENTERPRISE
// @changelog v3.3.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$validator = InputValidator::fromGet();
$days = $validator->int('days', 7, ['min' => 1, 'max' => 30]);
$CACHE_KEY = "panel:14:errors:{$days}";
$CACHE_TTL = RedisConfig::TTL_UI;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $top_errors = [];
    $stmt = $conn->query("
        SELECT SUBSTRING(error_message, 1, 200) as error_message, COUNT(*) as occurrences,
            COUNT(DISTINCT job_name) as affected_jobs, MAX(execution_start) as last_occurrence,
            MIN(execution_start) as first_occurrence, GROUP_CONCAT(DISTINCT job_name ORDER BY job_name SEPARATOR ', ') as jobs_list
        FROM sync_jobs_history WHERE status = 'error' AND error_message IS NOT NULL AND error_message != ''
            AND execution_start > DATE_SUB(NOW(), INTERVAL {$days} DAY)
        GROUP BY SUBSTRING(error_message, 1, 200) ORDER BY occurrences DESC LIMIT 20
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $jobs_array = explode(', ', $row['jobs_list']);
        $top_errors[] = [
            'error_message' => $row['error_message'], 'occurrences' => (int)$row['occurrences'],
            'affected_jobs' => (int)$row['affected_jobs'], 'jobs_list' => array_slice($jobs_array, 0, 5),
            'last_occurrence' => $row['last_occurrence'], 'first_occurrence' => $row['first_occurrence'],
            'severity' => $row['occurrences'] > 100 ? 'critical' : ($row['occurrences'] > 50 ? 'high' : ($row['occurrences'] > 10 ? 'medium' : 'low'))
        ];
    }

    $jobs_with_errors = [];
    $stmt = $conn->query("
        SELECT job_name, COUNT(*) as error_count, MAX(execution_start) as last_error, COUNT(DISTINCT DATE(execution_start)) as days_with_errors
        FROM sync_jobs_history WHERE status = 'error' AND execution_start > DATE_SUB(NOW(), INTERVAL {$days} DAY)
        GROUP BY job_name ORDER BY error_count DESC LIMIT 15
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $jobs_with_errors[] = ['job_name' => $row['job_name'], 'error_count' => (int)$row['error_count'], 'last_error' => $row['last_error'], 'days_with_errors' => (int)$row['days_with_errors'], 'avg_errors_per_day' => round($row['error_count'] / $days, 2)];
    }

    $errors_by_day = [];
    $stmt = $conn->query("
        SELECT DATE(execution_start) as error_date, COUNT(*) as error_count, COUNT(DISTINCT job_name) as affected_jobs
        FROM sync_jobs_history WHERE status = 'error' AND execution_start > DATE_SUB(NOW(), INTERVAL {$days} DAY)
        GROUP BY DATE(execution_start) ORDER BY error_date DESC
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $errors_by_day[] = ['date' => $row['error_date'], 'error_count' => (int)$row['error_count'], 'affected_jobs' => (int)$row['affected_jobs']];
    }

    $stats = $conn->query("
        SELECT COUNT(*) as total_errors, COUNT(DISTINCT job_name) as jobs_with_errors, COUNT(DISTINCT DATE(execution_start)) as days_with_errors
        FROM sync_jobs_history WHERE status = 'error' AND execution_start > DATE_SUB(NOW(), INTERVAL {$days} DAY)
    ")->fetch(PDO::FETCH_ASSOC);

    $output = ApiResponse::buildSuccess([
        'period' => ['days' => $days, 'from' => date('Y-m-d', strtotime("-{$days} days")), 'to' => date('Y-m-d')],
        'statistics' => ['total_errors' => (int)$stats['total_errors'], 'jobs_with_errors' => (int)$stats['jobs_with_errors'], 'days_with_errors' => (int)$stats['days_with_errors'], 'avg_errors_per_day' => round($stats['total_errors'] / $days, 2)],
        'top_errors' => $top_errors, 'jobs_with_most_errors' => $jobs_with_errors, 'errors_by_day' => $errors_by_day
    ], ['rows_affected' => count($top_errors), 'version' => '3.3.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
