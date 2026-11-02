<?php
// Card 10 - Performance Score Global
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:10:performance-global:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT 
            AVG(success_rate) as avg_rate,
            AVG(avg_execution_time) as avg_time,
            COUNT(*) as total_jobs
        FROM sync_jobs WHERE is_active = 1 AND is_deleted = 0
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $avgRate = (float)($data['avg_rate'] ?? 0);
    $avgTime = (float)($data['avg_time'] ?? 0);
    $timePenalty = $avgTime > 30 ? min(20, ($avgTime - 30) * 0.4) : 0;
    $score = max(0, min(100, round($avgRate - $timePenalty)));
    
    $output = ApiResponse::buildSuccess([
        'performance_score' => $score,
        'success_rate' => round($avgRate, 1),
        'avg_time' => round($avgTime, 2),
        'total_jobs' => (int)($data['total_jobs'] ?? 0),
        'title' => 'Performance Global'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
