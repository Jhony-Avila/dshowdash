<?php
// UI - Orchestrator Version
// @version 2.3.1-FIX
// @changelog v2.3.1-FIX - Adicionado require ApiResponse.php

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$CACHE_KEY = 'ui:orchestrator-version';
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $manifestPath = '/var/www/dshowdash/public/components/container-main/orchestrator-manifest.json';
    $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;
    $data = ['version' => $manifest['version'] ?? '0.0.0', 'build' => $manifest['build'] ?? null, 'timestamp' => $manifest['timestamp'] ?? null, 'last_modified' => file_exists($manifestPath) ? date('c', filemtime($manifestPath)) : null];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.1-FIX']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
