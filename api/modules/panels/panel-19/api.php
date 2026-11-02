<?php
// Panel 19 - Gráfico Taxa de Sucesso Enterprise
// @version 3.4.1-PATH-FIX
// @changelog v3.4.1-PATH-FIX: Fixed extra parenthesis in GROUP BY query
// @changelog v3.4.0-PATH-FIX: Fixed _init.php path (../../ → ../) - was causing 500 error
// @changelog v3.3.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$validator = InputValidator::fromGet();
$days = $validator->int('days', 30, ['min' => 1, 'max' => 90]);
$CACHE_KEY = "panel:19:success:{$days}";
$CACHE_TTL = RedisConfig::TTL_UI;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $daily_rates = [];
    $stmt = $conn->query("
        SELECT DATE(execution_start) as date, COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
            ROUND((SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as success_rate
        FROM sync_jobs_history WHERE execution_start >= DATE_SUB(CURDATE(), INTERVAL " . (int)$days . " DAY)
        GROUP BY DATE(execution_start) ORDER BY date ASC
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $daily_rates[] = ['date' => $row['date'], 'total' => (int)$row['total'], 'success' => (int)$row['success'], 'errors' => (int)$row['errors'], 'success_rate' => (float)$row['success_rate']];
    }

    $stats = $conn->query("
        SELECT COUNT(*) as total_executions, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as total_success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as total_errors,
            ROUND((SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as avg_success_rate,
            ROUND(AVG(execution_time_seconds), 2) as avg_execution_time
        FROM sync_jobs_history WHERE execution_start >= DATE_SUB(CURDATE(), INTERVAL " . (int)$days . " DAY)
    ")->fetch(PDO::FETCH_ASSOC);

    $best_day = null;
    $worst_day = null;
    foreach ($daily_rates as $day) {
        if ($day['total'] >= 10) {
            if (!$best_day || $day['success_rate'] > $best_day['success_rate']) { $best_day = $day; }
            if (!$worst_day || $day['success_rate'] < $worst_day['success_rate']) { $worst_day = $day; }
        }
    }

    $recent = array_slice($daily_rates, -7);
    $previous = array_slice($daily_rates, -14, 7);

    $recent_avg = count($recent) > 0 ? array_sum(array_column($recent, 'success_rate')) / count($recent) : 0;
    $previous_avg = count($previous) > 0 ? array_sum(array_column($previous, 'success_rate')) / count($previous) : 0;

    $trend = $recent_avg - $previous_avg;
    $trend_status = $trend > 1 ? 'improving' : ($trend < -1 ? 'declining' : 'stable');

    $output = ApiResponse::buildSuccess([
        'period' => ['days' => $days, 'from' => date('Y-m-d', strtotime("-{$days} days")), 'to' => date('Y-m-d')],
        'chart_data' => $daily_rates,
        'summary' => [
            'total_executions' => (int)$stats['total_executions'], 'total_success' => (int)$stats['total_success'],
            'total_errors' => (int)$stats['total_errors'], 'avg_success_rate' => (float)$stats['avg_success_rate'],
            'avg_execution_time' => (float)$stats['avg_execution_time']
        ],
        'highlights' => ['best_day' => $best_day, 'worst_day' => $worst_day],
        'trend' => ['recent_7d_avg' => round($recent_avg, 2), 'previous_7d_avg' => round($previous_avg, 2), 'change' => round($trend, 2), 'status' => $trend_status]
    ], ['rows_affected' => count($daily_rates), 'version' => '3.4.1-PATH-FIX']);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
