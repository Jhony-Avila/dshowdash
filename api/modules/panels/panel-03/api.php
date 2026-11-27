<?php
// Painel 03 - Execuções por Hora (Redis Cache)
// @version 2.7.0-P06-ENTERPRISE
// @changelog v2.7.0-P06: Migrado para ApiResponse
// @changelog v2.6.0-BOOT-SAFE: Timeout guardrail + fallback rápido

require_once __DIR__ . '/../_init.php';
// PAINEIS-SESSAO-14 (18/11/2026): contenção — exigir sessão antes de qualquer cache/dado (mesmo mecanismo do panel-01/16).
require_once __DIR__ . '/../../../_helpers/AuthHelpers.php';
require_once __DIR__ . '/../../../core/SessionGate.php';
SessionGate::start();
AuthHelpers::requireAuth();

$validator = InputValidator::fromGet();
define('MAX_HOURS_ALLOWED', 168);
$hours = $validator->int('hours', 24, ['min' => 1, 'max' => MAX_HOURS_ALLOWED]);
$CACHE_KEY = "panel:03:hours:{$hours}";
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

set_time_limit(8);
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $conn->exec("SET SESSION max_execution_time = 5000");
    
    $stmt = $conn->query("
        SELECT DATE_FORMAT(execution_start, '%Y-%m-%d %H:00:00') as hour, COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors,
            SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
            AVG(execution_time_seconds) as avg_time, MIN(execution_time_seconds) as min_time, MAX(execution_time_seconds) as max_time
        FROM sync_jobs_history WHERE execution_start > DATE_SUB(NOW(), INTERVAL " . (int)$hours . " HOUR)
        GROUP BY DATE_FORMAT(execution_start, '%Y-%m-%d %H:00:00') ORDER BY hour DESC
    ");
    
    $hourly = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $hourly[] = [
            'hour' => $row['hour'], 'total' => (int)$row['total'],
            'success' => (int)$row['success'], 'errors' => (int)$row['errors'], 'running' => (int)$row['running'],
            'success_rate' => $row['total'] > 0 ? round(($row['success'] / $row['total']) * 100, 2) : 0,
            'avg_time' => round($row['avg_time'], 2), 'min_time' => round($row['min_time'], 2), 'max_time' => round($row['max_time'], 2)
        ];
    }

    $stats = $conn->query("
        SELECT COUNT(*) as total_executions, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as total_success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as total_errors
        FROM sync_jobs_history WHERE execution_start > DATE_SUB(NOW(), INTERVAL " . (int)$hours . " HOUR)
    ")->fetch(PDO::FETCH_ASSOC);

    $output = ApiResponse::buildSuccess([
        'hourly' => $hourly,
        'period' => [
            'hours' => $hours,
            'total_executions' => (int)$stats['total_executions'],
            'total_success' => (int)$stats['total_success'],
            'total_errors' => (int)$stats['total_errors'],
            'overall_success_rate' => $stats['total_executions'] > 0 ? round(($stats['total_success'] / $stats['total_executions']) * 100, 2) : 0
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], ['version' => '2.7.0-P06-ENTERPRISE']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    $isTimeout = stripos($e->getMessage(), 'timeout') !== false || stripos($e->getMessage(), 'max_execution_time') !== false;
    
    // MIG-001 (INTEGRACAO, 26/11 noite, VINHO; achado do AZUL): o timeout devolvia 200 com ZEROS (total, sucessos, erros, taxa) e ainda guardava
    // isso 30 s no cache — falso zero. Agora: 503 com a fonte e o motivo, nada em cache (a tela mostra "indisponível", como os outros painéis).
    if ($isTimeout) {
        error_log('[panel-03] INTEGRACAO: tempo esgotado');
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['fonte' => 'integracao', 'estado' => 'indisponivel', 'motivo' => 'tempo_esgotado']);
    } else {
        ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
    }
}
