<?php
// Card 01 - Taxa Diária (Success Rate + Histórico Sparkline)
// @version 4.5.0-P06-ENTERPRISE
// @changelog v4.5.0-P06: Migrado catch para ApiResponse::error()
// @changelog v4.4.0: Migrado para RedisHelper centralizado

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:01:metrics:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $today = date('Y-m-d');
    
    $stmt = $conn->query("
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            AVG(success_rate) as success_rate,
            AVG(avg_execution_time) as avg_time
        FROM sync_jobs
        WHERE is_deleted = 0
    ");
    $general = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $conn->prepare("
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
        FROM sync_jobs_history
        WHERE DATE(execution_start) = ?
    ");
    $stmt->execute([$today]);
    $counters = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $conn->query("
        SELECT
            DATE_FORMAT(execution_start, '%Y-%m-%d %H:00:00') as hour,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
        FROM sync_jobs_history
        WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY hour
        ORDER BY hour ASC
    ");
    
    $history = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $rate = $row['total'] > 0 ? round(($row['success'] / $row['total']) * 100, 1) : 0;
        $history[] = ['hour' => $row['hour'], 'rate' => $rate, 'total' => (int)$row['total'], 'success' => (int)$row['success']];
    }
    
    $totalToday = (int)$counters['total'];
    $successToday = (int)$counters['success_count'];
    $errorToday = (int)$counters['error_count'];
    $dailyRate = $totalToday > 0 ? round(($successToday / $totalToday) * 100, 1) : round($general['success_rate'], 1);
    
    $data = [
        'total_jobs' => (int)$general['total'],
        'active_jobs' => (int)$general['active'],
        'success_rate' => $dailyRate,
        'successRate' => $dailyRate,
        'avg_execution_time' => round($general['avg_time'], 2),
        'success' => $successToday,
        'sucesso' => $successToday,
        'error' => $errorToday,
        'erro' => $errorToday,
        'errors' => $errorToday,
        'total_executions_today' => $totalToday,
        'history' => $history
    ];
    
    $result = ApiResponse::buildSuccess($data, [
        'version' => '4.5.0-P06-ENTERPRISE',
        'cache' => 'miss',
        'timestamp' => date('c')
    ]);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $result, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
