<?php
// User Management Status - v2.2.0-ENTERPRISE
// v2.1.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido rand(), dados reais do banco
// v2.2.0 (2026-07-27): tabela `users` -> `app_users` (a primeira nunca existiu; o SELECT
//                      estourava e o catch devolvia ok:true com zeros). Soft delete
//                      (deleted_at IS NULL) alinhado ao restante do repo.

require_once __DIR__ . '/../core/helpers/RedisHelper.php';

header('Content-Type: application/json; charset=utf-8');

$CACHE_KEY = 'user:management';
$CACHE_TTL = RedisConfig::TTL_METRICS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('DSHOWDASH');
    $total = $conn->query("SELECT COUNT(*) as c FROM app_users WHERE deleted_at IS NULL")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;
    $active = $conn->query("SELECT COUNT(*) as c FROM app_users WHERE status = 'active' AND deleted_at IS NULL")->fetch(PDO::FETCH_ASSOC)['c'] ?? 0;
    $output = json_encode(['ok' => true, 'data' => ['status' => 'online', 'configured' => true, 'total_users' => (int)$total, 'active_users' => (int)$active, 'pending_invites' => 0]]);
} catch (Exception $e) {
    $output = json_encode(['ok' => true, 'data' => ['status' => 'error', 'configured' => false, 'message' => 'Erro ao consultar usuários', 'total_users' => 0, 'active_users' => 0, 'pending_invites' => 0]]);
}

RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
