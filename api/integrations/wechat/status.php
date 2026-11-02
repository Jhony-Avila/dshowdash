<?php
// WeChat Integration Status
// @version 3.2.0-ENTERPRISE
// @updated 2026-01-21
// v3.2.0: Migrado para ApiResponse::buildSuccess()
// v3.1.0: Migrado para RedisHelper centralizado
// P0.1 FIX: Migrado para CorsPolicy::setupApiEndpoint()

require_once __DIR__ . '/../../core/CorsPolicy.php';
require_once __DIR__ . '/../../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint([
    'methods' => ['GET', 'OPTIONS'],
    'no_cache' => false
]);

$CACHE_KEY = 'integration:wechat';
$CACHE_TTL = RedisConfig::TTL_STATUS;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

$isConfigured = false;

if ($isConfigured) {
    $data = [
        'status' => 'connected',
        'configured' => true,
        'unread_count' => 0,
        'provider' => 'wechat-api'
    ];
} else {
    $data = [
        'status' => 'not_configured',
        'configured' => false,
        'message' => 'Integração WeChat não configurada',
        'integration' => 'wechat',
        'unread_count' => 0
    ];
}

$meta = ['updated_at' => date('c'), 'version' => '3.2.0-ENTERPRISE'];
$output = ApiResponse::buildSuccess($data, $meta);
RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
