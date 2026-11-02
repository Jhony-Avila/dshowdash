<?php
// Card 03 - Performance Score
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:03:performance:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT AVG(success_rate) as avg_rate, AVG(avg_execution_time) as avg_time
        FROM sync_jobs WHERE is_active = 1 AND is_deleted = 0
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $avgRate = round((float)($data['avg_rate'] ?? 0), 1);
    $avgTime = round((float)($data['avg_time'] ?? 0), 2);
    $score = min(100, max(0, round($avgRate - ($avgTime > 60 ? ($avgTime - 60) * 0.5 : 0))));
    
    $output = ApiResponse::buildSuccess([
        'score' => $score,
        'success_rate' => $avgRate,
        'avg_time' => $avgTime,
        'title' => 'Performance Score'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
