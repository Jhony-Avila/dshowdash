<?php
// Card 08 - Média por Hora
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:08:avg-per-hour:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT COUNT(*) / GREATEST(HOUR(TIMEDIFF(MAX(execution_start), MIN(execution_start))), 1) as avg_per_hour
        FROM sync_jobs_history WHERE DATE(execution_start) = CURDATE()
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $output = ApiResponse::buildSuccess([
        'average_per_hour' => round((float)($data['avg_per_hour'] ?? 0), 1),
        'title' => 'Média por Hora'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
