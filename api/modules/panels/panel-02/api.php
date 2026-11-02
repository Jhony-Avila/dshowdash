<?php
// Painel 02 - Monitoramento de Jobs Enterprise (Redis Cache)
// @version 3.4.0-P06-ENTERPRISE
// @changelog v3.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'panel:02:jobs';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

$slaDefaults = ['threshold_success_rate' => 95.0, 'threshold_duration_ms' => 30000, 'threshold_error_count' => 5];

try {
    $conn = getConnection('INTEGRACAO');

    $stmt = $conn->query("
        SELECT id, job_name, job_type, is_active, is_running, last_execution, last_success,
            total_executions, success_rate, error_count, avg_execution_time, created_at, updated_at
        FROM sync_jobs WHERE is_deleted = 0
        ORDER BY CASE WHEN error_count > 5 THEN 0 ELSE 1 END, CASE WHEN success_rate < 95 THEN 0 ELSE 1 END, last_execution DESC
    ");

    $jobs = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['sla'] = calculateJobSLA($row, $slaDefaults);
        $row['health_status'] = calculateHealthStatus($row, $slaDefaults);
        $jobs[] = $row;
    }

    $overview = calculateOverview($jobs);
    $statusCounts = calculateStatusCounts($jobs);

    $output = ApiResponse::buildSuccess([
        'overview' => $overview, 'status_counts' => $statusCounts, 'jobs' => $jobs,
        'meta' => ['total' => count($jobs), 'updated_at' => date('c'), 'sla_defaults' => $slaDefaults]
    ], ['version' => '3.4.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}

function calculateJobSLA($job, $slaDefaults) {
    $successRate = floatval($job['success_rate'] ?? 0);
    $avgTime = floatval($job['avg_execution_time'] ?? 0) * 1000;
    $errorCount = intval($job['error_count'] ?? 0);
    return [
        'success_rate' => ['value' => $successRate, 'threshold' => $slaDefaults['threshold_success_rate'], 'status' => $successRate >= $slaDefaults['threshold_success_rate'] ? 'ok' : ($successRate >= 80 ? 'warning' : 'critical')],
        'duration' => ['value' => $avgTime, 'threshold' => $slaDefaults['threshold_duration_ms'], 'status' => $avgTime <= $slaDefaults['threshold_duration_ms'] ? 'ok' : ($avgTime <= $slaDefaults['threshold_duration_ms'] * 1.5 ? 'warning' : 'critical')],
        'errors' => ['value' => $errorCount, 'threshold' => $slaDefaults['threshold_error_count'], 'status' => $errorCount <= 0 ? 'ok' : ($errorCount <= $slaDefaults['threshold_error_count'] ? 'warning' : 'critical')]
    ];
}

function calculateHealthStatus($job, $slaDefaults) {
    $sla = $job['sla'] ?? calculateJobSLA($job, $slaDefaults);
    if ($job['is_active'] != 1) return 'inactive';
    $hasCritical = $sla['success_rate']['status'] === 'critical' || $sla['duration']['status'] === 'critical' || $sla['errors']['status'] === 'critical';
    $hasWarning = $sla['success_rate']['status'] === 'warning' || $sla['duration']['status'] === 'warning' || $sla['errors']['status'] === 'warning';
    return $hasCritical ? 'critical' : ($hasWarning ? 'warning' : 'healthy');
}

function calculateOverview($jobs) {
    $total = count($jobs); $active = $inactive = $running = $healthy = $warning = $critical = $totalExecutions = $totalErrors = 0; $avgSuccessRate = 0;
    foreach ($jobs as $job) {
        if ($job['is_active'] == 1) $active++; else $inactive++;
        if ($job['is_running'] == 1) $running++;
        $status = $job['health_status'] ?? 'inactive';
        if ($status === 'healthy') $healthy++; elseif ($status === 'warning') $warning++; elseif ($status === 'critical') $critical++;
        $totalExecutions += intval($job['total_executions'] ?? 0); $totalErrors += intval($job['error_count'] ?? 0); $avgSuccessRate += floatval($job['success_rate'] ?? 0);
    }
    return ['total_jobs' => $total, 'active_jobs' => $active, 'inactive_jobs' => $inactive, 'running_jobs' => $running, 'health' => ['healthy' => $healthy, 'warning' => $warning, 'critical' => $critical], 'metrics' => ['total_executions' => $totalExecutions, 'total_errors' => $totalErrors, 'avg_success_rate' => $total > 0 ? round($avgSuccessRate / $total, 2) : 0]];
}

function calculateStatusCounts($jobs) {
    $ok = $warning = $error = 0;
    foreach ($jobs as $job) { $status = $job['health_status'] ?? 'inactive'; if ($status === 'healthy') $ok++; elseif ($status === 'warning') $warning++; elseif ($status === 'critical') $error++; }
    return ['ok' => $ok, 'warning' => $warning, 'error' => $error];
}
