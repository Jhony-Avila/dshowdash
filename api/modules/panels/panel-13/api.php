<?php
// Painel 13 - SLA e Disponibilidade (Redis Cache)
// @version 2.6.0-P06-ENTERPRISE
// @changelog v2.6.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$validator = InputValidator::fromGet();
$days = $validator->int('days', 30, ['min' => 1, 'max' => 90]);
$CACHE_KEY = "panel:13:days:{$days}";
$CACHE_TTL = RedisConfig::TTL_UI;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    
    $availability = $conn->query("
        SELECT COUNT(*) as total_executions, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
            ROUND((SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 3) as availability_percent
        FROM sync_jobs_history WHERE execution_start > DATE_SUB(NOW(), INTERVAL " . (int)$days . " DAY)
    ")->fetch(PDO::FETCH_ASSOC);

    $sla_jobs = [];
    $stmt = $conn->query("
        SELECT j.job_name, j.job_type, j.total_executions, j.success_rate, j.avg_execution_time, j.error_count,
            COUNT(h.id) as recent_executions, SUM(CASE WHEN h.status = 'success' THEN 1 ELSE 0 END) as recent_success,
            SUM(CASE WHEN h.status = 'error' THEN 1 ELSE 0 END) as recent_errors
        FROM sync_jobs j LEFT JOIN sync_jobs_history h ON h.job_name = j.job_name AND h.execution_start > DATE_SUB(NOW(), INTERVAL " . (int)$days . " DAY)
        WHERE j.is_deleted = 0 AND j.is_active = 1 AND j.total_executions > 10
        GROUP BY j.id, j.job_name ORDER BY j.success_rate DESC, j.total_executions DESC LIMIT 30
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $recent = (int)$row['recent_executions'];
        $success_rate = (float)$row['success_rate'];
        $sla_jobs[] = [
            'job_name' => $row['job_name'], 'job_type' => $row['job_type'],
            'avg_execution_time' => round($row['avg_execution_time'], 2), 'success_rate' => round($success_rate, 2),
            'total_executions' => (int)$row['total_executions'], 'recent_executions' => $recent,
            'recent_success' => (int)$row['recent_success'], 'recent_errors' => (int)$row['recent_errors'],
            'recent_success_rate' => $recent > 0 ? round(((int)$row['recent_success'] / $recent) * 100, 2) : 0,
            'status' => $success_rate >= 99.0 ? 'excellent' : ($success_rate >= 95.0 ? 'good' : ($success_rate >= 90.0 ? 'warning' : 'critical'))
        ];
    }

    $critical_jobs = [];
    $stmt = $conn->query("
        SELECT job_name, COUNT(*) as error_count, MAX(execution_start) as last_error, MIN(execution_start) as first_error
        FROM sync_jobs_history WHERE status = 'error' AND execution_start > DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY job_name HAVING error_count >= 3 ORDER BY error_count DESC, last_error DESC LIMIT 10
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $critical_jobs[] = ['job_name' => $row['job_name'], 'error_count' => (int)$row['error_count'], 'last_error' => $row['last_error'], 'first_error' => $row['first_error']];
    }

    $output = ApiResponse::buildSuccess([
        'period' => ['days' => $days, 'from' => date('Y-m-d', strtotime("-{$days} days")), 'to' => date('Y-m-d')],
        'availability' => [
            'total_executions' => (int)$availability['total_executions'], 'successful' => (int)$availability['successful'],
            'failed' => (int)$availability['failed'], 'availability_percent' => (float)$availability['availability_percent'],
            'uptime_status' => (float)$availability['availability_percent'] >= 99.9 ? 'excellent' : ((float)$availability['availability_percent'] >= 99.0 ? 'good' : 'poor')
        ],
        'jobs_sla' => $sla_jobs, 'critical_jobs' => $critical_jobs,
        'summary' => [
            'total_active_jobs' => count($sla_jobs),
            'excellent_jobs' => count(array_filter($sla_jobs, fn($j) => $j['status'] === 'excellent')),
            'good_jobs' => count(array_filter($sla_jobs, fn($j) => $j['status'] === 'good')),
            'warning_jobs' => count(array_filter($sla_jobs, fn($j) => $j['status'] === 'warning')),
            'critical_jobs' => count($critical_jobs)
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], ['version' => '2.6.0-P06-ENTERPRISE']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
