<?php
// Dashboard - Performance API Enterprise
// @job_name api-performance
// @version 2.4.0-ENTERPRISE
// @description Métricas de performance com Redis Cache
// @updated 2026-01-21
// v2.3.0: SQL Injection fix + RedisHelper migration
// P3.5 FIX: Adicionado CORS centralizado
// P2.1 FIX: Migrado para ApiResponse
// P5.0 FIX: Migrado para InputValidator

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

// P3.2: Autenticação obrigatória
require_once __DIR__ . '/../core/SessionGate.php';
SessionGate::start();
if (!SessionGate::validate()) {
    ApiResponse::error(ApiResponse::ERR_NOT_AUTHENTICATED, 401);
}
header('Cache-Control: no-store');

// SECURITY: Whitelist para períodos válidos (previne SQL injection)
$ALLOWED_PERIODS = [
    '1d' => '1 DAY',
    '7d' => '7 DAY',
    '30d' => '30 DAY',
    '90d' => '90 DAY'
];

// InputValidator para validação centralizada
$validator = InputValidator::fromGet();
$period = $validator->enum('period', '7d', ['1d', '7d', '30d', '90d']);

$CACHE_KEY = "dashboard:performance:{$period}";
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    // SECURITY: Usa valor do whitelist validado acima
    $interval = $ALLOWED_PERIODS[$period];

    // Top jobs mais lentos
    $slow_jobs = [];
    $stmt = $conn->query("
        SELECT job_name, AVG(execution_time_seconds) as avg_time,
            MAX(execution_time_seconds) as max_time, COUNT(*) as executions
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL {$interval}) AND status = 'success'
        GROUP BY job_name ORDER BY avg_time DESC LIMIT 10
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $slow_jobs[] = $row; }

    // Top jobs com mais erros
    $error_jobs = [];
    $stmt = $conn->query("
        SELECT job_name, COUNT(*) as error_count, MAX(execution_start) as last_error
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL {$interval}) AND status = 'error'
        GROUP BY job_name ORDER BY error_count DESC LIMIT 10
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $error_jobs[] = $row; }

    // Jobs mais executados
    $most_executed = [];
    $stmt = $conn->query("
        SELECT job_name, COUNT(*) as executions,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successes,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL {$interval})
        GROUP BY job_name ORDER BY executions DESC LIMIT 10
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $most_executed[] = $row; }

    $result = [
        'ok' => true,
        'data' => [
            'slow_jobs' => $slow_jobs,
            'error_jobs' => $error_jobs,
            'most_executed' => $most_executed,
            'period' => $period
        ],
        'error' => null,
        'meta' => ['timestamp' => date('c')]
    ];

    $output = json_encode($result, JSON_UNESCAPED_UNICODE);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log(basename(__FILE__) . ' error: ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno do servidor']);
}
