<?php
// Dashboard - Filtered Data API Enterprise
// @job_name api-filtered-data
// @version 2.5.0-ENTERPRISE
// @description Dados filtrados e agregados com Redis Cache
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

// InputValidator para validação centralizada
$validator = InputValidator::fromGet();

$entity = $validator->enum('entity', 'jobs', ['jobs', 'executions', 'errors', 'performance']);
$group_by = $validator->enum('group_by', 'day', ['hour', 'day', 'week', 'month']);
$date_from = $validator->date('date_from', date('Y-m-d', strtotime('-30 days')));
$date_to = $validator->date('date_to', date('Y-m-d'));

require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = "dashboard:filtered:{$entity}:{$group_by}:{$date_from}:{$date_to}";
$CACHE_TTL = 180;

// Redis com auto-close
if (RedisHelper::serveIfCached($CACHE_KEY)) {
    exit;
}
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    $filters = [
        'entity' => $entity,
        'date_from' => $date_from,
        'date_to' => $date_to,
        'group_by' => $group_by
    ];

    $data = [];
    $group_format = get_date_format($group_by);

    switch ($entity) {
        case 'jobs':
            $stmt = $conn->prepare("
                SELECT DATE_FORMAT(last_execution, '{$group_format}') as period,
                    COUNT(*) as total_jobs,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_jobs,
                    AVG(success_rate) as avg_success_rate
                FROM sync_jobs WHERE is_deleted = 0
                    AND last_execution >= :date_from AND last_execution <= :date_to
                GROUP BY period ORDER BY period ASC
            ");
            $stmt->execute(['date_from' => $date_from, 'date_to' => $date_to]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'executions':
            $stmt = $conn->prepare("
                SELECT DATE_FORMAT(execution_start, '{$group_format}') as period,
                    COUNT(*) as total_executions,
                    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed,
                    AVG(execution_time_seconds) as avg_time
                FROM sync_jobs_history
                WHERE execution_start >= :date_from AND execution_start <= :date_to
                GROUP BY period ORDER BY period ASC
            ");
            $stmt->execute(['date_from' => $date_from, 'date_to' => $date_to]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'errors':
            $stmt = $conn->prepare("
                SELECT DATE_FORMAT(execution_start, '{$group_format}') as period,
                    COUNT(*) as error_count
                FROM sync_jobs_history
                WHERE status = 'error' AND execution_start >= :date_from AND execution_start <= :date_to
                GROUP BY period ORDER BY period ASC
            ");
            $stmt->execute(['date_from' => $date_from, 'date_to' => $date_to]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;

        case 'performance':
            $stmt = $conn->prepare("
                SELECT job_name, AVG(execution_time_seconds) as avg_time,
                    MIN(execution_time_seconds) as min_time, MAX(execution_time_seconds) as max_time,
                    COUNT(*) as executions
                FROM sync_jobs_history
                WHERE execution_start >= :date_from AND execution_start <= :date_to AND status = 'success'
                GROUP BY job_name ORDER BY avg_time DESC LIMIT 20
            ");
            $stmt->execute(['date_from' => $date_from, 'date_to' => $date_to]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            break;
    }

    $result = [
        'ok' => true,
        'data' => ['data' => $data, 'filters' => $filters, 'total' => count($data)],
        'error' => null,
        'meta' => ['rows_affected' => count($data), 'timestamp' => date('c')]
    ];

    $output = json_encode($result, JSON_UNESCAPED_UNICODE);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(__FILE__) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno do servidor']);
}

function get_date_format($group_by) {
    $formats = ['hour' => '%Y-%m-%d %H:00', 'day' => '%Y-%m-%d', 'week' => '%Y-%U', 'month' => '%Y-%m'];
    return isset($formats[$group_by]) ? $formats[$group_by] : '%Y-%m-%d';
}
