<?php
// Painel 15 - Overview Metricas
// @version 3.2.0-P06-ENTERPRISE

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = "panel:15:overview";
$CACHE_TTL = RedisConfig::TTL_UI;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    
    $overview = $conn->query("SELECT COUNT(*) as total_jobs, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_jobs, SUM(CASE WHEN is_running = 1 THEN 1 ELSE 0 END) as running_jobs, ROUND(AVG(success_rate), 2) as avg_success_rate FROM sync_jobs WHERE is_deleted = 0")->fetch(PDO::FETCH_ASSOC);
    
    $recent_activity = $conn->query("SELECT job_name, status, execution_start, execution_time_seconds FROM sync_jobs_history ORDER BY execution_start DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
    
    $top_jobs = $conn->query("SELECT job_name, total_executions, success_rate, avg_execution_time FROM sync_jobs WHERE is_deleted = 0 ORDER BY total_executions DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
    
    $alerts_summary = $conn->query("SELECT COUNT(*) as total, SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical, SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning FROM sync_job_alerts WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND deleted = 0")->fetch(PDO::FETCH_ASSOC);
    
    $data = ['overview' => $overview, 'recent_activity' => $recent_activity, 'top_jobs' => $top_jobs, 'alerts_summary' => $alerts_summary, 'timestamp' => date('Y-m-d H:i:s')];
    
    $output = ApiResponse::buildSuccess($data, ['version' => '3.2.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
