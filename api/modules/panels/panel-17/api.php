<?php
// Painel 17 - Top 10 Jobs (Redis Cache)
// @version 3.3.0-P06-ENTERPRISE
// @changelog v3.3.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';
// PAINEIS-SESSAO-14 (18/11/2026): contenção — exigir sessão antes de qualquer cache/dado (mesmo mecanismo do panel-01/16).
require_once __DIR__ . '/../../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../core/SessionGate.php';
SessionGate::start();
AuthHelpers::requireAuth();

$CACHE_KEY = "panel:17:overview";
$CACHE_TTL = RedisConfig::TTL_UI;

require_once __DIR__ . '/../../../obs/ObsConsumidor.php';
if (ObsConsumidor::ligado()) ObsConsumidor::responder($CACHE_KEY, (int) $CACHE_TTL, '3.3.0-P06-ENTERPRISE', fn(ObsExecucoes $o) => $o->painelVisaoGeralLegado() + ['timestamp' => date('Y-m-d H:i:s')]);
if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    
    $overview = $conn->query("
        SELECT COUNT(*) as total_jobs, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_jobs,
            SUM(CASE WHEN is_running = 1 THEN 1 ELSE 0 END) as running_jobs, ROUND(AVG(success_rate), 2) as avg_success_rate
        FROM sync_jobs WHERE is_deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);
    
    $recent_activity = [];
    $stmt = $conn->query("SELECT job_name, status, execution_start, execution_time_seconds FROM sync_jobs_history ORDER BY execution_start DESC LIMIT 20");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $recent_activity[] = $row; }
    
    $top_jobs = [];
    $stmt = $conn->query("SELECT job_name, total_executions, success_rate, avg_execution_time FROM sync_jobs WHERE is_deleted = 0 ORDER BY total_executions DESC LIMIT 10");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $top_jobs[] = $row; }
    
    $alerts_summary = $conn->query("
        SELECT COUNT(*) as total, SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning
        FROM sync_job_alerts WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);
    
    $output = ApiResponse::buildSuccess([
        'overview' => $overview, 'recent_activity' => $recent_activity, 'top_jobs' => $top_jobs,
        'alerts_summary' => $alerts_summary, 'timestamp' => date('Y-m-d H:i:s')
    ], ['version' => '3.3.0-P06-ENTERPRISE']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}