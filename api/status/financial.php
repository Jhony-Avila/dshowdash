<?php
// Financial Status - v3.1.0-ENTERPRISE
// v3.1.0: Migrado para ApiResponse::buildSuccess()
// v3.0.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do banco
// P3.5 FIX: Adicionado CORS centralizado
require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

$CACHE_KEY = 'status:financial';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $total = $conn->query("SELECT COUNT(*) as c FROM requisicoes WHERE MONTH(data_criacao) = MONTH(NOW())")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;
    $pending = $conn->query("SELECT COUNT(*) as c FROM requisicoes WHERE situacao = 'pendente' AND MONTH(data_criacao) = MONTH(NOW())")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;
    $data = ['status' => 'online', 'configured' => true, 'month_transactions' => (int)$total, 'pending' => (int)$pending, 'health' => 'good'];
    $output = ApiResponse::buildSuccess($data);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    error_log("[status:financial] Error: " . $e->getMessage());
    $data = ['status' => 'error', 'configured' => false, 'message' => 'Erro ao consultar dados financeiros', 'month_transactions' => 0, 'pending' => 0, 'health' => 'unknown'];
    $output = ApiResponse::buildSuccess($data);
    echo $output;
    RedisHelper::close();
}
