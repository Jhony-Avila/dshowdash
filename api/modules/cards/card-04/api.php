<?php
// Card 04 - Pico do Dia (Horário com mais execuções)
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:04:peak-hour:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT HOUR(execution_start) as hour, COUNT(*) as total
        FROM sync_jobs_history
        WHERE DATE(execution_start) = CURDATE()
        GROUP BY hour ORDER BY total DESC LIMIT 1
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $peakHour = $data ? sprintf('%02d:00', (int)$data['hour']) : '--:--';
    $peakCount = $data ? (int)$data['total'] : 0;
    
    $output = ApiResponse::buildSuccess([
        'peak_hour' => $peakHour,
        'executions' => $peakCount,
        'title' => 'Pico do Dia'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
