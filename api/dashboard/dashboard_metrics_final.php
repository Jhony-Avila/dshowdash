<?php
// Dashboard Metrics Final - Com Redis Cache
// @version 1.6.0-ENTERPRISE
// @updated 2026-01-21
// P3.5 FIX: Adicionado CORS centralizado
// P2.1 FIX: Migrado para ApiResponse
// P4.0 FIX: Migrado para RedisHelper
// P5.0 FIX: InputValidator disponível via _init.php

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

// InputValidator disponível para uso futuro
// $validator = InputValidator::fromGet();

$CACHE_KEY = 'dashboard:metrics:final';
$CACHE_TTL = RedisConfig::TTL_METRICS;

// Redis - verificar cache
if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    
    // Query 1: Jobs
    $jobs = $conn->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN is_running = 1 THEN 1 ELSE 0 END) as running,
            SUM(CASE WHEN error_count > 0 THEN 1 ELSE 0 END) as with_errors,
            AVG(success_rate) as avg_success_rate
        FROM sync_jobs WHERE is_deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);
    
    // Query 2: Executions 24h
    $exec_24h = $conn->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
            AVG(execution_time_seconds) as avg_time
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ")->fetch(PDO::FETCH_ASSOC);
    
    // Query 3: Executions 1h
    $exec_1h = $conn->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    ")->fetch(PDO::FETCH_ASSOC);
    
    // Query 4: Alerts
    $alerts = $conn->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
            SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning,
            SUM(CASE WHEN severity = 'info' THEN 1 ELSE 0 END) as info
        FROM sync_job_alerts
        WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) AND deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);
    
    // Query 5: Server
    $server = $conn->query("
        SELECT * FROM server_status_history ORDER BY collected_at DESC LIMIT 1
    ")->fetch(PDO::FETCH_ASSOC);
    if (!$server) $server = [];
    
    $data = [
        'jobs' => $jobs,
        'executions' => ['last_24h' => $exec_24h, 'last_hour' => $exec_1h],
        'alerts' => $alerts,
        'server' => $server,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    $output = json_encode(['ok' => true, 'data' => $data, 'error' => null], JSON_UNESCAPED_UNICODE);

    header('Content-Type: application/json; charset=utf-8');
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(__FILE__) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno do servidor']);
}
