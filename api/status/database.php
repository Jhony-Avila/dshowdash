<?php
// Status Database API Enterprise - v3.0.0-ENTERPRISE
// v3.0.0: Migrado para ApiResponse::buildSuccess()/buildError()
// v2.0.0: Migrado para RedisHelper centralizado
// P1.1: Migrado 'success' para 'ok'
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:database';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $pdo = getConnection('INTEGRACAO');
    $start = microtime(true);
    $pdo->query("SELECT 1");
    $latency = round((microtime(true) - $start) * 1000, 2);

    $tables = $pdo->query("SHOW TABLE STATUS")->fetchAll(PDO::FETCH_ASSOC);
    $totalRows = array_sum(array_column($tables, 'Rows'));
    $totalSize = array_sum(array_column($tables, 'Data_length')) + array_sum(array_column($tables, 'Index_length'));

    $data = [
        'status' => 'online',
        'uptime' => '99.9%',
        'latency' => $latency . 'ms',
        'usage' => round($totalSize / 1024 / 1024, 1) . 'MB',
        'tables' => count($tables),
        'rows' => number_format($totalRows),
        'details' => 'Database INTEGRACAO: ' . count($tables) . ' tabelas, ' . number_format($totalRows) . ' registros',
        'timestamp' => date('Y-m-d H:i:s')
    ];

    $output = ApiResponse::buildSuccess($data, ['version' => '3.0.0', 'cache' => 'miss']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log("[status:database] Error: " . $e->getMessage());
    $output = ApiResponse::buildError(ApiResponse::ERR_DATABASE_ERROR, [
        'status' => 'offline',
        'message' => 'Erro interno'
    ]);
    echo $output;
    RedisHelper::close();
}
