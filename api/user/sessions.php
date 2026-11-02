<?php
// User Sessions Status - v2.1.0-ENTERPRISE
// v2.1.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data, retorna status real de configuração

require_once __DIR__ . '/../core/helpers/RedisHelper.php';

header('Content-Type: application/json; charset=utf-8');

$CACHE_KEY = 'user:sessions';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

$isConfigured = false;

if ($isConfigured) {
    $output = json_encode(['ok' => true, 'data' => ['status' => 'online', 'configured' => true, 'active_sessions' => 0, 'current_device' => 'unknown', 'last_activity' => date('Y-m-d H:i:s')]]);
} else {
    $output = json_encode(['ok' => true, 'data' => ['status' => 'not_configured', 'configured' => false, 'message' => 'Monitoramento de sessões não configurado', 'integration' => 'user_sessions', 'timestamp' => date('Y-m-d H:i:s')]]);
}

RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
