<?php
// News Ticker Data API
// @version 3.3.0-P06-FIX
// @changelog v3.3.0-P06-FIX - Added missing ApiResponse require

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS']]);
header('Cache-Control: no-store');

$CACHE_KEY = 'news:ticker';
$CACHE_TTL = 60;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

$startTime = microtime(true);

require_once __DIR__ . '/RSSFetcher.php';
require_once __DIR__ . '/NewsNormalizer.php';
$config = require __DIR__ . '/config.php';

$fxConfig = ['pairs' => ['USD-BRL', 'EUR-BRL', 'CNY-BRL'], 'api_url' => 'https://economia.awesomeapi.com.br/json/last/', 'timeout' => 3];
$stocksConfig = ['symbols' => ['PETR4', 'VALE3', 'ITUB4', 'BBDC4'], 'api_url' => 'https://brapi.dev/api/quote/', 'timeout' => 4];

function fetchFXData($config) {
    $url = $config['api_url'] . implode(',', $config['pairs']);
    $ctx = stream_context_create(['http' => ['timeout' => $config['timeout'], 'ignore_errors' => true]]);
    $response = @file_get_contents($url, false, $ctx);
    if (!$response) return [];
    $data = json_decode($response, true);
    if (!$data) return [];
    $result = [];
    foreach ($data as $item) {
        if (!isset($item['code'], $item['bid'])) continue;
        $price = floatval($item['bid']);
        if ($price <= 0) continue;
        $result[] = ['type' => 'fx', 'id' => 'fx-' . strtolower($item['code'] . ($item['codein'] ?? 'BRL')), 'symbol' => $item['code'] . '/' . ($item['codein'] ?? 'BRL'), 'price' => $price, 'change_pct' => floatval($item['pctChange'] ?? 0), 'source' => 'awesomeapi', 'published_at' => date('c')];
    }
    return $result;
}

function fetchStocksData($config) {
    $results = [];
    $ctx = stream_context_create(['http' => ['timeout' => $config['timeout'], 'ignore_errors' => true]]);
    foreach (array_slice($config['symbols'], 0, 4) as $symbol) {
        $response = @file_get_contents($config['api_url'] . $symbol, false, $ctx);
        if (!$response) continue;
        $data = json_decode($response, true);
        if (!$data || empty($data['results'])) continue;
        $item = $data['results'][0];
        $price = floatval($item['regularMarketPrice'] ?? 0);
        if ($price <= 0) continue;
        $results[] = ['type' => 'stock', 'id' => 'stock-' . strtolower($item['symbol'] ?? $symbol), 'symbol' => $item['symbol'] ?? $symbol, 'name' => $item['shortName'] ?? '', 'price' => $price, 'change_pct' => floatval($item['regularMarketChangePercent'] ?? 0), 'source' => 'b3', 'published_at' => date('c')];
    }
    return $results;
}

function fetchNewsData($config) {
    try {
        $fetcher = new RSSFetcher($config);
        $rawItems = $fetcher->fetchAll();
        if (empty($rawItems)) return [];
        $normalizer = new NewsNormalizer($config);
        $normalized = $normalizer->normalize($rawItems);
        return array_map(function($item) { $item['type'] = 'news'; return $item; }, array_slice($normalized, 0, 10));
    } catch (Exception $e) { return []; }
}

function interleaveData($news, $fx, $stocks) {
    $result = [];
    $ni = $fi = $si = 0;
    $pattern = ['news', 'news', 'fx', 'news', 'news', 'stock'];
    $pi = 0;
    while (count($result) < 25) {
        $type = $pattern[$pi++ % count($pattern)];
        if ($type === 'news' && $ni < count($news)) $result[] = $news[$ni++];
        elseif ($type === 'fx' && $fi < count($fx)) $result[] = $fx[$fi++];
        elseif ($type === 'stock' && $si < count($stocks)) $result[] = $stocks[$si++];
        elseif ($ni < count($news)) $result[] = $news[$ni++];
        else break;
    }
    return $result;
}

try {
    $newsData = fetchNewsData($config);
    $fxData = fetchFXData($fxConfig);
    $stocksData = fetchStocksData($stocksConfig);
    $combined = interleaveData($newsData, $fxData, $stocksData);

    $output = ApiResponse::buildSuccess($combined, ['news_count' => count($newsData), 'fx_count' => count($fxData), 'stocks_count' => count($stocksData), 'total' => count($combined), 'updated_at' => date('c'), 'elapsed_ms' => round((microtime(true) - $startTime) * 1000, 2), 'version' => '3.3.0-P06-FIX']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
