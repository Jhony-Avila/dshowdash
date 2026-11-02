<?php
// Server Get Status
// @version 3.2.0-P06-ENTERPRISE

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);
header('Cache-Control: no-store');

$CACHE_KEY = 'server:status';
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once __DIR__ . '/HostingerFetcher.php';
$config = require __DIR__ . '/config.php';

try {
    $fetcher = new HostingerFetcher($config);
    $data = $fetcher->getServerMetrics();
    $output = ApiResponse::buildSuccess($data, ['cached' => false, 'version' => '3.2.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
