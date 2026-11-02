<?php
// Yuan vs Dólar Currency API — USD/CNY
// @version 6.0.0-USDCNY-FRANKFURTER
// @changelog v6.0.0 (2026-07-08): pill Yuan volta a USD/CNY (cotação do Yuan vs Dólar, ~6,80) — decisão do dono.
//            Fonte Frankfurter (base=USD symbols=CNY, MESMA do painel panel-cotacao aba Yuan) → pill=painel em
//            rate E variação. Mantém percent_change/change_abs (pill lê data.percent_change). Cache key currency:usd-cny.
//            Fallback exchangerate-api rates.CNY (sem variação) → stale → hardcoded.
// @changelog v5.x: experimento CNY/BRL (revertido).

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

$CACHE_KEY = 'currency:usd-cny';
$CACHE_TTL = RedisConfig::TTL_EXTERNAL_API;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

function _cny_http_json(string $url, int $timeout = 4): ?array {
    $ctx = stream_context_create([
        'http' => ['timeout' => $timeout, 'header' => "User-Agent: DShowDash/6.0 (currency-usd-cny)\r\n", 'ignore_errors' => true],
        'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false || $raw === '') return null;
    $d = json_decode($raw, true);
    return is_array($d) ? $d : null;
}

try {
    // Primário: Frankfurter (USD->CNY), últimas ~2 semanas p/ derivar fecho anterior
    $end   = gmdate('Y-m-d');
    $start = gmdate('Y-m-d', time() - 14 * 86400);
    $j = _cny_http_json("https://api.frankfurter.dev/v1/{$start}..{$end}?base=USD&symbols=CNY", 5);

    $rate = null; $prev = null;
    if ($j && !empty($j['rates'])) {
        $daily = [];
        foreach ($j['rates'] as $d => $r) { if (isset($r['CNY'])) $daily[$d] = (float) $r['CNY']; }
        ksort($daily);
        $vals = array_values($daily);
        $n = count($vals);
        if ($n >= 1) $rate = $vals[$n - 1];
        if ($n >= 2) $prev = $vals[$n - 2];
    }

    // Fallback de rate: exchangerate-api rates.CNY (sem variação)
    if ($rate === null) {
        $ex = _cny_http_json('https://api.exchangerate-api.com/v4/latest/USD', 3);
        $cny = $ex['rates']['CNY'] ?? null;
        if ($cny) $rate = (float) $cny;
    }

    if ($rate === null) throw new Exception('USD/CNY rate not found');

    $data = [
        'pair'   => 'USD/CNY',
        'rate'   => round($rate, 4),
        'base'   => 'USD',
        'target' => 'CNY',
        'updated_at' => date('c'),
    ];
    if ($prev !== null && $prev > 0) {
        $data['change_abs']     = round($rate - $prev, 4);
        $data['percent_change'] = round((($rate - $prev) / $prev) * 100, 2);
        $data['prev_close']     = round($prev, 4);
    }

    $output = ApiResponse::buildSuccess($data, ['cached' => false, 'version' => '6.0.0-USDCNY-FRANKFURTER']);

    RedisHelper::setCache($CACHE_KEY . ':stale', $output, 86400);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    error_log("[currency:usd-cny] API error: " . $e->getMessage());

    $stale = RedisHelper::tryGetCache($CACHE_KEY . ':stale');
    if ($stale !== null) {
        header('Content-Type: application/json; charset=utf-8');
        header('X-Cache: STALE');
        echo $stale;
        RedisHelper::close();
    } else {
        $output = ApiResponse::buildSuccess([
            'pair' => 'USD/CNY', 'rate' => 6.80, 'base' => 'USD', 'target' => 'CNY',
            'updated_at' => date('c'), 'fallback' => true
        ], ['version' => '6.0.0-USDCNY-FRANKFURTER', 'fallback' => true]);
        header('Content-Type: application/json; charset=utf-8');
        echo $output;
        RedisHelper::close();
    }
}
