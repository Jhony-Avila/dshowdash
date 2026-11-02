<?php
// Dashboard - Historical Data API Enterprise
// @job_name api-historical-data
// @version 2.4.0-ENTERPRISE
// @description Dados históricos de execuções com Redis Cache
// @updated 2026-01-21
// P3.5 FIX: Adicionado CORS centralizado
// P2.1 FIX: Migrado para ApiResponse
// P5.0 FIX: Migrado para InputValidator

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

// P3.2: Autenticação obrigatória
require_once __DIR__ . '/../core/SessionGate.php';
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
header('Cache-Control: no-store');

require_once __DIR__ . '/../core/helpers/RedisHelper.php';

// InputValidator para validação centralizada
$validator = InputValidator::fromGet();

$job_name = $validator->string('job_name', '', ['maxLength' => 100]);
$status = $validator->enum('status', '', ['success', 'error', 'running', 'timeout', '']);
$date_from = $validator->date('date_from', date('Y-m-d', strtotime('-30 days')));
$date_to = $validator->date('date_to', date('Y-m-d'));
$limit = $validator->int('limit', 500, ['min' => 1, 'max' => 5000]);

$cache_job = $job_name ? md5($job_name) : 'all';
$cache_status = $status ? $status : 'all';
$CACHE_KEY = "dashboard:history:{$cache_job}:{$cache_status}:{$date_from}:{$date_to}:{$limit}";
$CACHE_TTL = 180;

// FIX: Usando RedisHelper
if (RedisHelper::serveIfCached($CACHE_KEY)) {
    exit;
}

header('X-Cache: MISS');
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    
    $where = ["execution_start >= :date_from", "execution_start <= :date_to"];
    $params = [':date_from' => $date_from . ' 00:00:00', ':date_to' => $date_to . ' 23:59:59'];
    
    if ($job_name) {
        $where[] = "job_name LIKE :job_name";
        $params[':job_name'] = '%' . $job_name . '%';
    }
    if ($status) {
        $where[] = "status = :status";
        $params[':status'] = $status;
    }

    $sql = "SELECT id, job_name, status, execution_start, execution_end,
            execution_time_seconds, rows_affected, error_message, run_id, exit_code
        FROM sync_jobs_history WHERE " . implode(' AND ', $where) . "
        ORDER BY execution_start DESC LIMIT :limit";

    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Estatísticas do período
    $statsWhere = array_slice($where, 0, 2 + ($job_name ? 1 : 0));
    $statsParams = array_slice($params, 0, 2 + ($job_name ? 1 : 0));
    
    $sql_stats = "SELECT COUNT(*) as total_executions,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
            AVG(execution_time_seconds) as avg_time,
            MAX(execution_time_seconds) as max_time,
            MIN(execution_time_seconds) as min_time
        FROM sync_jobs_history WHERE " . implode(' AND ', $statsWhere);
    
    $stmt_stats = $conn->prepare($sql_stats);
    $stmt_stats->execute($statsParams);
    $stats = $stmt_stats->fetch(PDO::FETCH_ASSOC);

    $filters = ['job_name' => $job_name, 'status' => $status, 'date_from' => $date_from, 'date_to' => $date_to, 'limit' => $limit];
    
    $result = [
        'ok' => true,
        'data' => ['history' => $history, 'statistics' => $stats, 'filters' => $filters, 'total' => count($history)],
        'error' => null,
        'meta' => ['rows_affected' => count($history), 'timestamp' => date('c')]
    ];

    $output = json_encode($result, JSON_UNESCAPED_UNICODE);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(__FILE__) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno do servidor']);
}
