<?php
// UI - Orchestrator Manifest
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$CACHE_KEY = 'ui:orchestrator-manifest';
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $manifestPath = '/var/www/dshowdash/public/components/container-main/orchestrator-manifest.json';
    if (!file_exists($manifestPath)) {
        echo ApiResponse::buildSuccess(['manifest' => null, 'exists' => false], ['version' => '2.3.0-P06-ENTERPRISE']);
        exit;
    }
    $manifest = json_decode(file_get_contents($manifestPath), true);
    $output = ApiResponse::buildSuccess(['manifest' => $manifest, 'exists' => true], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
