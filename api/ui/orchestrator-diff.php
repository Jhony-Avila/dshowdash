<?php
// UI - Orchestrator Diff
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);

$CACHE_KEY = 'ui:orchestrator-diff';
$CACHE_TTL = RedisConfig::TTL_CONFIG;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $manifestPath = '/var/www/dshowdash/public/components/container-main/orchestrator-manifest.json';
    $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;
    $data = ['has_manifest' => $manifest !== null, 'panels_count' => isset($manifest['panels']) ? count($manifest['panels']) : 0, 'version' => $manifest['version'] ?? 'unknown', 'last_modified' => file_exists($manifestPath) ? date('c', filemtime($manifestPath)) : null];
    $output = ApiResponse::buildSuccess($data, ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
