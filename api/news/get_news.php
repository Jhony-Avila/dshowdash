<?php
// News Feed API
// @version 3.3.0-P06-FIX
// @changelog v3.3.0-P06-FIX - Added missing ApiResponse require

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);
header('Cache-Control: no-store');

$CACHE_KEY = 'news:feed';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

$startTime = microtime(true);

require_once __DIR__ . '/RSSFetcher.php';
require_once __DIR__ . '/NewsNormalizer.php';
$config = require __DIR__ . '/config.php';

try {
    $fetcher = new RSSFetcher($config);
    $rawItems = $fetcher->fetchAll();

    if (empty($rawItems)) {
        echo ApiResponse::buildSuccess([], ['error' => 'rss_fetch_failed', 'version' => '3.3.0-P06-FIX']);
        exit;
    }

    $normalizer = new NewsNormalizer($config);
    $normalized = $normalizer->normalize($rawItems);
    $limited = array_slice($normalized, 0, $config['limits']['max_items']);

    $output = ApiResponse::buildSuccess($limited, ['cached' => false, 'updated_at' => date('c'), 'count' => count($limited), 'elapsed_ms' => round((microtime(true) - $startTime) * 1000, 2), 'version' => '3.3.0-P06-FIX']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
