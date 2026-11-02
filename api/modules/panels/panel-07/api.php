<?php
// Painel 07 - Procedures em Execução Enterprise
// @version 3.4.0-P06-ENTERPRISE
// @changelog v3.4.0-P06: Migrado para ApiResponse
// @changelog v3.3.0: Integrado InputValidator

require_once __DIR__ . '/../_init.php';
require_once '/var/www/dshowdash/config/db_connection.php';

$CACHE_KEY = 'panel:07:running';
$CACHE_TTL = RedisConfig::TTL_REALTIME;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $conn = getConnection('INTEGRACAO');

    $running = [];
    $stmt = $conn->query("
        SELECT j.id, j.job_name, j.job_type, j.last_execution, j.avg_execution_time,
            TIMESTAMPDIFF(SECOND, j.last_execution, NOW()) as running_for_seconds
        FROM sync_jobs j WHERE j.is_running = 1 AND j.is_deleted = 0
        ORDER BY j.last_execution ASC
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $running[] = [
            'id' => (int)$row['id'],
            'job_name' => $row['job_name'],
            'job_type' => $row['job_type'],
            'started_at' => $row['last_execution'],
            'running_for_seconds' => (int)$row['running_for_seconds'],
            'avg_execution_time' => round($row['avg_execution_time'], 2),
            'status' => $row['running_for_seconds'] > ($row['avg_execution_time'] * 2) ? 'slow' : 'normal'
        ];
    }

    $recent = [];
    $stmt = $conn->query("
        SELECT job_name, status, execution_start, execution_end, execution_time_seconds, rows_affected
        FROM sync_jobs_history WHERE execution_end > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY execution_end DESC LIMIT 20
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $recent[] = [
            'job_name' => $row['job_name'],
            'status' => $row['status'],
            'started_at' => $row['execution_start'],
            'finished_at' => $row['execution_end'],
            'duration' => round($row['execution_time_seconds'], 2),
            'rows_affected' => (int)$row['rows_affected']
        ];
    }

    $stats = $conn->query("
        SELECT COUNT(*) as total_running,
            SUM(CASE WHEN TIMESTAMPDIFF(SECOND, last_execution, NOW()) > avg_execution_time * 2 THEN 1 ELSE 0 END) as slow_jobs
        FROM sync_jobs WHERE is_running = 1 AND is_deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);

    $output = ApiResponse::buildSuccess([
        'running' => $running,
        'recent_completed' => $recent,
        'statistics' => [
            'total_running' => (int)$stats['total_running'],
            'slow_jobs' => (int)$stats['slow_jobs'],
            'normal_jobs' => (int)$stats['total_running'] - (int)$stats['slow_jobs']
        ]
    ], ['rows_affected' => count($running), 'version' => '3.4.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
