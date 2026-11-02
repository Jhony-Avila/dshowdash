<?php
// Card 02 - Taxa de Sucesso Global (últimas 24h)
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse::buildSuccess/error
// @changelog v4.3.0: Migrado para RedisHelper centralizado

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:02:success-rate:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $result = $conn->query("
        SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
        FROM sync_jobs_history WHERE execution_start > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ")->fetch(PDO::FETCH_ASSOC);
    
    $total = (int)$result['total'];
    $success = (int)$result['success'];
    $failed = (int)$result['error'];
    $rate = $total > 0 ? round(($success / $total) * 100, 1) : 0;
    
    $output = ApiResponse::buildSuccess([
        'value' => $rate . '%',
        'subtitle' => "$success de $total jobs ativos",
        'title' => 'Taxa de Sucesso Global',
        'total_executions' => $total,
        'successful' => $success,
        'failed' => $failed,
        'success_rate' => $rate
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
