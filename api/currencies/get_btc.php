<?php
// BTC Currency API
// @version 4.1.1-P07-ENTERPRISE
// @changelog v4.1.1-P07: Timeout 10s→3s, stale Redis fallback on API failure
// @changelog v4.1.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

$CACHE_KEY = 'currency:btc';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl,cny&include_24hr_change=true';
    $context = stream_context_create([
        'http' => ['timeout' => 3, 'header' => "User-Agent: DShowDash/4.1\r\n", 'ignore_errors' => false],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true]
    ]);
    $response = @file_get_contents($apiUrl, false, $context);
    
    if ($response === false) throw new Exception('API request failed');
    
    $apiData = json_decode($response, true);
    $btc = $apiData['bitcoin'] ?? null;
    
    if (!$btc) throw new Exception('BTC data not found');
    
    $output = ApiResponse::buildSuccess([
        'usd' => (int)($btc['usd'] ?? 0),
        'brl' => (int)($btc['brl'] ?? 0),
        'cny' => (int)($btc['cny'] ?? 0),
        'usd_24h_change' => round($btc['usd_24h_change'] ?? 0, 2),
        'updated_at' => date('c')
    ], ['cached' => false, 'version' => '4.1.0-P06-ENTERPRISE']);

    RedisHelper::setCache($CACHE_KEY . ':stale', $output, 86400);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log("[currency:btc] API error: " . $e->getMessage());

    // Tenta retornar cache stale (último valor válido, TTL 24h)
    $stale = RedisHelper::tryGetCache($CACHE_KEY . ':stale');
    if ($stale !== null) {
        error_log("[currency:btc] Serving stale cache");
        header('Content-Type: application/json; charset=utf-8');
        header('X-Cache: STALE');
        echo $stale;
        RedisHelper::close();
    } else {
        $output = ApiResponse::buildSuccess([
            'usd' => 95000, 'brl' => 570000, 'cny' => 690000, 'usd_24h_change' => 0,
            'updated_at' => date('c'), 'fallback' => true
        ], ['version' => '4.1.1-P07-ENTERPRISE', 'fallback' => true]);
        header('Content-Type: application/json; charset=utf-8');
        echo $output;
        RedisHelper::close();
    }
}
