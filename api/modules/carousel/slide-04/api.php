<?php
// Carousel Slide 04 - Top Erros
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../../_init.php';

$CACHE_KEY = 'carousel:slide-04';
$CACHE_TTL = RedisConfig::TTL_UI;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $errors = $conn->query("SELECT SUBSTRING(error_message, 1, 200) as error_key, error_message, COUNT(*) as occurrences, COUNT(DISTINCT CASE WHEN job_id IS NOT NULL THEN job_id END) as affected_jobs, MAX(execution_start) as last_occurrence FROM sync_jobs_history WHERE status = 'error' AND error_message IS NOT NULL AND error_message != '' AND execution_start >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY SUBSTRING(error_message, 1, 200) ORDER BY occurrences DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);

    $totalOccurrences = array_sum(array_column($errors, 'occurrences'));
    foreach ($errors as &$error) { $error['percentage'] = $totalOccurrences > 0 ? round(($error['occurrences'] / $totalOccurrences) * 100, 2) : 0; }

    $data = ['period' => '7 dias', 'total_errors' => $totalOccurrences, 'unique_errors' => count($errors), 'top_errors' => $errors];

    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
