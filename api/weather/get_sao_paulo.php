<?php
// Weather São Paulo API Enterprise
// @version 3.2.0-P06-ENTERPRISE
// @changelog v3.2.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

$CACHE_KEY = 'weather:sao-paulo';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once __DIR__ . '/OpenMeteoFetcher.php';
$config = require __DIR__ . '/config.php';

try {
    $fetcher = new OpenMeteoFetcher($config);
    $data = $fetcher->getSaoPauloWeather();
    
    $output = ApiResponse::buildSuccess($data, [
        'cached' => false,
        'version' => '3.2.0-P06-ENTERPRISE',
        'source' => 'open-meteo'
    ]);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log("[weather:sao-paulo] API error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess([
        'temperature' => 25,
        'feels_like' => 27,
        'humidity' => 60,
        'condition' => 'Parcialmente nublado',
        'icon' => '⛅',
        'updated_at' => date('c'),
        'fallback' => true
    ], ['version' => '3.2.0-P06-ENTERPRISE', 'fallback' => true]);
    header('Content-Type: application/json; charset=utf-8');
    echo $output;
    RedisHelper::close();
}
