<?php
// All Currencies API
// @version 4.1.0-P06-ENTERPRISE
// @changelog v4.1.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

$CACHE_KEY = 'currency:all';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $context = stream_context_create([
        'http' => ['timeout' => 10, 'header' => "User-Agent: DShowDash/4.1\r\n"],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]
    ]);
    
    $fxResponse = @file_get_contents('https://api.exchangerate-api.com/v4/latest/USD', false, $context);
    $btcResponse = @file_get_contents('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl,cny&include_24hr_change=true', false, $context);
    
    $fxData = $fxResponse ? json_decode($fxResponse, true) : null;
    $btcData = $btcResponse ? json_decode($btcResponse, true) : null;
    
    $output = ApiResponse::buildSuccess([
        'btc' => [
            'usd' => (int)($btcData['bitcoin']['usd'] ?? 95000),
            'brl' => (int)($btcData['bitcoin']['brl'] ?? 570000),
            'cny' => (int)($btcData['bitcoin']['cny'] ?? 690000),
            'usd_24h_change' => round($btcData['bitcoin']['usd_24h_change'] ?? 0, 2)
        ],
        'fx' => [
            'usd_brl' => round($fxData['rates']['BRL'] ?? 5.95, 4),
            'usd_cny' => round($fxData['rates']['CNY'] ?? 7.25, 4)
        ],
        'updated_at' => date('c')
    ], ['cached' => false, 'version' => '4.1.0-P06-ENTERPRISE']);

    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log("[currency:all] API error: " . $e->getMessage());
    $output = ApiResponse::buildSuccess([
        'btc' => ['usd' => 95000, 'brl' => 570000, 'cny' => 690000, 'usd_24h_change' => 0],
        'fx' => ['usd_brl' => 5.95, 'usd_cny' => 7.25],
        'updated_at' => date('c'), 'fallback' => true
    ], ['version' => '4.1.0-P06-ENTERPRISE', 'fallback' => true]);
    header('Content-Type: application/json; charset=utf-8');
    echo $output;
    RedisHelper::close();
}
