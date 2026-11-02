<?php
// User Notifications Status - v2.1.0-ENTERPRISE
// v2.1.0: Migrado para RedisHelper centralizado
// P2.1 FIX: Removido mock data, retorna status real de configuração

require_once __DIR__ . '/../core/helpers/RedisHelper.php';

header('Content-Type: application/json; charset=utf-8');

$CACHE_KEY = 'user:notifications';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

$isConfigured = false;

if ($isConfigured) {
    $output = json_encode(['ok' => true, 'data' => ['status' => 'online', 'configured' => true, 'unread' => 0, 'total' => 0, 'last_notification' => null]]);
} else {
    $output = json_encode(['ok' => true, 'data' => ['status' => 'not_configured', 'configured' => false, 'message' => 'Sistema de notificações não configurado', 'integration' => 'notifications', 'unread' => 0, 'total' => 0]]);
}

RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
