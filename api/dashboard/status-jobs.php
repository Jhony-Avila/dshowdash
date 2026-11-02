<?php
// Dashboard - Status Jobs API Enterprise
// @job_name api-status-jobs
// @version 2.4.0-ENTERPRISE
// @description Status geral dos jobs com Redis Cache
// @updated 2026-01-21
// P3.5 FIX: Adicionado CORS centralizado
// P2.1 FIX: Migrado para ApiResponse
// P5.0 FIX: InputValidator disponível via _init.php

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

// InputValidator disponível para uso futuro
// $validator = InputValidator::fromGet();

$CACHE_KEY = 'dashboard:status-jobs';
$CACHE_TTL = 120;

// Redis com auto-close
if (RedisHelper::serveIfCached($CACHE_KEY)) {
    exit;
}
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');

    // Contagem por status
    $counts = $conn->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
            SUM(CASE WHEN is_running = 1 THEN 1 ELSE 0 END) as running,
            SUM(CASE WHEN error_count > 0 THEN 1 ELSE 0 END) as with_errors
        FROM sync_jobs WHERE is_deleted = 0
    ")->fetch(PDO::FETCH_ASSOC);

    // Jobs em execução
    $running = [];
    $stmt = $conn->query("
        SELECT id, job_name, last_execution, avg_execution_time
        FROM sync_jobs WHERE is_running = 1 AND is_deleted = 0
        ORDER BY last_execution ASC
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $running[] = $row; }

    // Jobs com erro recente
    $with_errors = [];
    $stmt = $conn->query("
        SELECT id, job_name, error_count, last_execution
        FROM sync_jobs WHERE error_count > 0 AND is_deleted = 0
        ORDER BY error_count DESC LIMIT 10
    ");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $with_errors[] = $row; }

    $result = [
        'ok' => true,
        'data' => ['counts' => $counts, 'running' => $running, 'with_errors' => $with_errors],
        'error' => null,
        'meta' => ['timestamp' => date('c')]
    ];

    $output = json_encode($result, JSON_UNESCAPED_UNICODE);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(__FILE__) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500, ['message' => 'Erro interno do servidor']);
}
