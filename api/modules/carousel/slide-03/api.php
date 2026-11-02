<?php
// Carousel Slide 03 - Execucoes por Hora
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'carousel:slide-03';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $hourly = $conn->query("SELECT HOUR(execution_start) as hour, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count, COUNT(*) as total FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY HOUR(execution_start) ORDER BY hour ASC")->fetchAll(PDO::FETCH_ASSOC);

    $totalSuccess = array_sum(array_column($hourly, 'success_count'));
    $totalError = array_sum(array_column($hourly, 'error_count'));

    $data = ['period' => '24 horas', 'total_success' => $totalSuccess, 'total_error' => $totalError, 'total' => $totalSuccess + $totalError, 'hourly' => $hourly];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
