<?php
// Card 06 - Jobs com Falha Hoje
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:06:failed:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT COUNT(*) as failed
        FROM sync_jobs_history
        WHERE DATE(execution_start) = CURDATE() AND status = 'error'
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $output = ApiResponse::buildSuccess([
        'failed' => (int)($data['failed'] ?? 0),
        'title' => 'Jobs com Falha'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
