<?php
// Card 11 - Tempo Médio de Execução
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:11:avg-time:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT AVG(TIMESTAMPDIFF(SECOND, execution_start, execution_end)) as avg_seconds
        FROM sync_jobs_history
        WHERE DATE(execution_start) = CURDATE() AND execution_end IS NOT NULL
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $avgSeconds = (float)($data['avg_seconds'] ?? 0);
    
    $output = ApiResponse::buildSuccess([
        'average_time' => round($avgSeconds, 2),
        'formatted' => $avgSeconds > 60 ? round($avgSeconds / 60, 1) . 'm' : round($avgSeconds) . 's',
        'title' => 'Tempo Médio'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
