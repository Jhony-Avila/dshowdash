<?php
declare(strict_types=1);
// Painel-09 API - Jobs em Execução Enterprise
// @version 3.5.0-P06-ENTERPRISE
// @changelog v3.5.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$cacheKey = 'panel:09:running-jobs';
$cacheTTL = RedisConfig::TTL_REALTIME;

if (RedisHelper::serveIfCached($cacheKey)) { exit; }

require_once '/opt/dshow_secure/config/database.php';

try {
    $stmt = $pdo->query("
        SELECT id, job_name, job_type, is_running, last_execution, success_rate, avg_execution_time, total_executions,
            TIMESTAMPDIFF(SECOND, last_execution, NOW()) as running_seconds
        FROM sync_jobs WHERE is_running = 1 AND is_deleted = 0 ORDER BY last_execution DESC
    ");
    $runningJobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalRunning = count($runningJobs);
    $avgRunningTime = $totalRunning > 0 ? round(array_sum(array_column($runningJobs, 'running_seconds')) / $totalRunning) : 0;

    $output = ApiResponse::buildSuccess([
        'jobs' => $runningJobs,
        'summary' => ['total_running' => $totalRunning, 'avg_running_time' => $avgRunningTime],
        'timestamp' => date('c')
    ], ['version' => '3.5.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($cacheKey, $output, $cacheTTL);

} catch (Throwable $e) {
    RedisHelper::close();
    error_log("panel-09 error: " . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
