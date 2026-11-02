<?php
// Dashboard - Status Executions API Enterprise
// @job_name api-status-executions
// @version 2.4.0-ENTERPRISE
// @description Status de execuções recentes com Redis Cache
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

$CACHE_KEY = 'dashboard:status-executions';
$CACHE_TTL = RedisConfig::TTL_MODULES;

// Redis - verificar cache
if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    // Estatísticas últimas 24h
    $stats_24h = $conn->query("
        SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
            AVG(execution_time_seconds) as avg_time
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ")->fetch(PDO::FETCH_ASSOC);

    // Últimas execuções
    $recent = [];
    $stmt = $conn->query("
        SELECT job_name, status, execution_start, execution_time_seconds, rows_affected
        FROM sync_jobs_history ORDER BY execution_start DESC LIMIT 20
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $recent[] = $row; }

    // Execuções por hora (últimas 12h)
    $by_hour = [];
    $stmt = $conn->query("
        SELECT DATE_FORMAT(execution_start, '%Y-%m-%d %H:00') as hour,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors
        FROM sync_jobs_history
        WHERE execution_start > DATE_SUB(NOW(), INTERVAL 12 HOUR)
        GROUP BY hour ORDER BY hour ASC
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $by_hour[] = $row; }

    $result = [
        'ok' => true,
        'data' => ['stats_24h' => $stats_24h, 'recent' => $recent, 'by_hour' => $by_hour],
        'error' => null,
        'meta' => ['timestamp' => date('c')]
    ];

    $output = json_encode($result, JSON_UNESCAPED_UNICODE);
    header('Content-Type: application/json; charset=utf-8');
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(__FILE__) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno do servidor']);
}
