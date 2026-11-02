<?php
// USD/BRL Currency API
// @version 5.0.0-USDBRL-FRANKFURTER
// @changelog v5.0.0 (2026-07-08): fonte Frankfurter (base=USD symbols=BRL), MESMA do painel panel-cotacao (aba
//            Dólar) → pill=painel em rate E variação. Adiciona percent_change/change_abs (pill lê data.percent_change
//            → deixa de mostrar 0,00%). Fallback exchangerate-api (rate, sem variação) → stale → hardcoded.
// @changelog v4.1.1-P07: Timeout 10s→3s, stale Redis fallback on API failure

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

$CACHE_KEY = 'currency:usd-brl';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

function _brl_http_json(string $url, int $timeout = 4): ?array {
    $ctx = stream_context_create([
        'http' => ['timeout' => $timeout, 'header' => "User-Agent: DShowDash/5.0 (currency-usd-brl)\r\n", 'ignore_errors' => true],
        'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false || $raw === '') return null;
    $d = json_decode($raw, true);
    return is_array($d) ? $d : null;
}

try {
    $end   = gmdate('Y-m-d');
    $start = gmdate('Y-m-d', time() - 14 * 86400);
    $j = _brl_http_json("https://api.frankfurter.dev/v1/{$start}..{$end}?base=USD&symbols=BRL", 5);

    $rate = null; $prev = null;
    if ($j && !empty($j['rates'])) {
        $daily = [];
        foreach ($j['rates'] as $d => $r) { if (isset($r['BRL'])) $daily[$d] = (float) $r['BRL']; }
        ksort($daily);
        $vals = array_values($daily);
        $n = count($vals);
        if ($n >= 1) $rate = $vals[$n - 1];
        if ($n >= 2) $prev = $vals[$n - 2];
    }

    if ($rate === null) {
        $ex = _brl_http_json('https://api.exchangerate-api.com/v4/latest/USD', 3);
        $brl = $ex['rates']['BRL'] ?? null;
        if ($brl) $rate = (float) $brl;
    }

    if ($rate === null) throw new Exception('BRL rate not found');

    $data = [
        'pair'   => 'USD/BRL',
        'rate'   => round($rate, 4),
        'base'   => 'USD',
        'target' => 'BRL',
        'updated_at' => date('c'),
    ];
    if ($prev !== null && $prev > 0) {
        $data['change_abs']     = round($rate - $prev, 4);
        $data['percent_change'] = round((($rate - $prev) / $prev) * 100, 2);
        $data['prev_close']     = round($prev, 4);
    }

    $output = ApiResponse::buildSuccess($data, ['cached' => false, 'version' => '5.0.0-USDBRL-FRANKFURTER']);

    RedisHelper::setCache($CACHE_KEY . ':stale', $output, 86400);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log("[currency:usd-brl] API error: " . $e->getMessage());

    $stale = RedisHelper::tryGetCache($CACHE_KEY . ':stale');
    if ($stale !== null) {
        header('Content-Type: application/json; charset=utf-8');
        header('X-Cache: STALE');
        echo $stale;
        RedisHelper::close();
    } else {
        $output = ApiResponse::buildSuccess([
            'pair' => 'USD/BRL', 'rate' => 5.15, 'base' => 'USD', 'target' => 'BRL',
            'updated_at' => date('c'), 'fallback' => true
        ], ['version' => '5.0.0-USDBRL-FRANKFURTER', 'fallback' => true]);
        header('Content-Type: application/json; charset=utf-8');
        echo $output;
        RedisHelper::close();
    }
}
