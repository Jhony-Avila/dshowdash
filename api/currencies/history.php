<?php
/**
 * Currency History API — série histórica p/ painéis de cotação (estilo Google Finance)
 * @version 1.1.0
 * @changelog v1.1.0 (2026-07-08): FX generalizado base→alvo (fx_target); +ativo usd-cny (Yuan vs Dólar).
 * @created 2026-07-08
 *
 * GET /api/currencies/history.php?asset={usd-brl|cny-brl|usd-cny|btc}&range={1D|5D|1M|6M|YTD|1A|5A|MAX}
 *
 * Fontes (proxy servidor→externo, nunca chamado direto do front):
 *   - FX (usd-brl, cny-brl, usd-cny): Frankfurter (api.frankfurter.dev) — sem chave, sem quota, ECB desde 1999.
 *   - FX 1D intraday: buffer rolling em Redis (amostra o spot; sem tabela de banco).
 *   - BTC: CoinGecko market_chart (mesma fonte já usada em get_btc.php).
 */

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

// ----------------------------------------------------------------------------
// Config de ativos e períodos
// ----------------------------------------------------------------------------
const ASSETS = [
    'usd-brl' => ['pair' => 'USD/BRL', 'kind' => 'fx', 'fx_base' => 'USD', 'fx_target' => 'BRL'],
    'cny-brl' => ['pair' => 'CNY/BRL', 'kind' => 'fx', 'fx_base' => 'CNY', 'fx_target' => 'BRL'],
    'usd-cny' => ['pair' => 'USD/CNY', 'kind' => 'fx', 'fx_base' => 'USD', 'fx_target' => 'CNY'],
    'btc'     => ['pair' => 'BTC/USD', 'kind' => 'crypto', 'cg_vs' => 'usd'],
];
const RANGES = ['1D', '5D', '1M', '6M', 'YTD', '1A', '5A', 'MAX'];
const MAX_POINTS = 480;
const FRANKFURTER = 'https://api.frankfurter.dev/v1';
const COINGECKO   = 'https://api.coingecko.com/api/v3';
const INTRADAY_TTL = 90000;
const INTRADAY_MIN_GAP = 120;

// ----------------------------------------------------------------------------
// Entrada
// ----------------------------------------------------------------------------
$asset = isset($_GET['asset']) ? strtolower(trim($_GET['asset'])) : '';
$range = isset($_GET['range']) ? strtoupper(trim($_GET['range'])) : '1D';

if (!isset(ASSETS[$asset])) {
    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'asset inválido', 'allowed' => array_keys(ASSETS)]);
}
if (!in_array($range, RANGES, true)) {
    ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 400, ['message' => 'range inválido', 'allowed' => RANGES]);
}

$cfg = ASSETS[$asset];
$extras = isset($_GET['extras']) ? array_filter(array_map('trim', explode(',', strtolower($_GET['extras'])))) : [];
$wantOhlc = in_array('ohlc', $extras, true);
$extrasSuffix = $wantOhlc ? ':ohlc' : '';
$CACHE_KEY = "currency:hist:{$asset}:{$range}{$extrasSuffix}";
$CACHE_TTL = ($range === '1D') ? 90 : (($range === '5D') ? 300 : 3600);

$isFxIntraday = ($cfg['kind'] === 'fx' && $range === '1D');
if (!$isFxIntraday && RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

// ----------------------------------------------------------------------------
// HTTP helper
// ----------------------------------------------------------------------------
function http_get_json(string $url, int $timeout = 6): ?array {
    $ctx = stream_context_create([
        'http' => ['timeout' => $timeout, 'header' => "User-Agent: DShowDash/1.1 (currency-history)\r\n", 'ignore_errors' => true],
        'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false || $raw === '') return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function downsample(array $points, int $max): array {
    $n = count($points);
    if ($n <= $max) return $points;
    $step = $n / $max;
    $out = [];
    for ($i = 0; $i < $max; $i++) { $out[] = $points[(int) floor($i * $step)]; }
    $last = $points[$n - 1];
    if (end($out) !== $last) $out[] = $last;
    return $out;
}

// ----------------------------------------------------------------------------
// FX: spot atual (cacheado) via Frankfurter latest — USD/BRL, CNY/BRL e USD/CNY
// ----------------------------------------------------------------------------
function fx_spot(): ?array {
    $cached = RedisHelper::tryGetCache('currency:spot:fx');
    if ($cached !== null) {
        $d = json_decode($cached, true);
        if (is_array($d)) return $d;
    }
    $j = http_get_json(FRANKFURTER . '/latest?base=USD&symbols=BRL,CNY', 5);
    if (!$j || empty($j['rates']['BRL']) || empty($j['rates']['CNY'])) return null;
    $usdBrl = (float) $j['rates']['BRL'];
    $usdCny = (float) $j['rates']['CNY'];
    $spot = [
        'usd-brl' => round($usdBrl, 4),
        'cny-brl' => round($usdBrl / $usdCny, 4),
        'usd-cny' => round($usdCny, 4),
        'date'    => $j['date'] ?? gmdate('Y-m-d'),
        'ts'      => time() * 1000,
    ];
    RedisHelper::setCache('currency:spot:fx', json_encode($spot), 45);
    return $spot;
}

// FX: cotação do dia (current + fecho anterior) via timeseries últimos dias úteis
function fx_quote(string $asset, string $base, string $target): array {
    $spot = fx_spot();
    $current = $spot[$asset] ?? null;

    $end   = gmdate('Y-m-d');
    $start = gmdate('Y-m-d', time() - 12 * 86400);
    $j = http_get_json(FRANKFURTER . "/{$start}..{$end}?base={$base}&symbols={$target}", 6);
    $daily = [];
    if ($j && !empty($j['rates'])) {
        foreach ($j['rates'] as $d => $r) {
            if (isset($r[$target])) $daily[$d] = (float) $r[$target];
        }
        ksort($daily);
    }
    $vals = array_values($daily);
    $lastClose = count($vals) ? end($vals) : null;
    $prevClose = count($vals) >= 2 ? $vals[count($vals) - 2] : $lastClose;
    if ($current === null) $current = $lastClose;

    $changeAbs = ($current !== null && $prevClose !== null) ? round($current - $prevClose, 4) : null;
    $changePct = ($changeAbs !== null && $prevClose) ? round(($changeAbs / $prevClose) * 100, 4) : null;
    return [
        'current'    => $current,
        'prev_close' => $prevClose !== null ? round($prevClose, 4) : null,
        'change_abs' => $changeAbs,
        'change_pct' => $changePct,
        'ts'         => $spot['ts'] ?? (time() * 1000),
    ];
}

// FX: buffer intraday rolling em Redis (amostra o spot a cada request)
function fx_intraday_points(string $asset, string $base, string $target): array {
    $key = "currency:intraday:{$asset}";
    $buf = [];
    $cached = RedisHelper::tryGetCache($key);
    if ($cached !== null) {
        $d = json_decode($cached, true);
        if (is_array($d)) $buf = $d;
    }
    $spot = fx_spot();
    if ($spot && isset($spot[$asset])) {
        $now = time() * 1000;
        $lastTs = count($buf) ? $buf[count($buf) - 1][0] : 0;
        if ($now - $lastTs >= INTRADAY_MIN_GAP * 1000) {
            $buf[] = [$now, (float) $spot[$asset]];
        }
    }
    $cut = (time() - 26 * 3600) * 1000;
    $buf = array_values(array_filter($buf, fn($p) => $p[0] >= $cut));
    if (count($buf) > 800) $buf = array_slice($buf, -800);
    RedisHelper::setCache($key, json_encode($buf), INTRADAY_TTL);

    $cold = false;
    if (count($buf) < 3) {
        $cold = true;
        $end = gmdate('Y-m-d');
        $start = gmdate('Y-m-d', time() - 6 * 86400);
        $j = http_get_json(FRANKFURTER . "/{$start}..{$end}?base={$base}&symbols={$target}", 6);
        $seed = [];
        if ($j && !empty($j['rates'])) {
            $rates = $j['rates'];
            ksort($rates);
            foreach ($rates as $d => $r) {
                if (isset($r[$target])) $seed[] = [strtotime($d . ' 00:00:00 UTC') * 1000, (float) $r[$target]];
            }
        }
        $buf = array_merge($seed, $buf);
    }
    return ['points' => $buf, 'cold' => $cold];
}

// ----------------------------------------------------------------------------
// FX: série diária via Frankfurter timeseries
// ----------------------------------------------------------------------------
function fx_daily_series(string $base, string $target, string $range): array {
    $end = gmdate('Y-m-d');
    switch ($range) {
        case '5D':  $startTs = time() - 8 * 86400; break;
        case '1M':  $startTs = strtotime('-1 month'); break;
        case '6M':  $startTs = strtotime('-6 months'); break;
        case 'YTD': $startTs = strtotime(gmdate('Y') . '-01-01'); break;
        case '1A':  $startTs = strtotime('-1 year'); break;
        case '5A':  $startTs = strtotime('-5 years'); break;
        case 'MAX': $startTs = strtotime('1999-01-04'); break;
        default:    $startTs = strtotime('-1 month');
    }
    $fetchStart = gmdate('Y-m-d', $startTs - 7 * 86400);
    $rangeStart = gmdate('Y-m-d', $startTs);

    $j = http_get_json(FRANKFURTER . "/{$fetchStart}..{$end}?base={$base}&symbols={$target}", 8);
    if (!$j || empty($j['rates'])) return ['points' => [], 'prev_close' => null];

    $rates = $j['rates'];
    ksort($rates);
    $all = [];
    foreach ($rates as $d => $r) {
        if (isset($r[$target])) $all[$d] = (float) $r[$target];
    }
    $prevClose = null;
    $points = [];
    foreach ($all as $d => $v) {
        if ($d < $rangeStart) { $prevClose = $v; continue; }
        $points[] = [strtotime($d . ' 00:00:00 UTC') * 1000, $v];
    }
    if ($prevClose === null && count($points)) $prevClose = $points[0][1];
    return ['points' => $points, 'prev_close' => $prevClose];
}

// ----------------------------------------------------------------------------
// BTC: série via CoinGecko market_chart + quote via simple/price
// ----------------------------------------------------------------------------
function btc_days(string $range): string {
    switch ($range) {
        case '1D':  return '1';
        case '5D':  return '5';
        case '1M':  return '30';
        case '6M':  return '180';
        case 'YTD': return (string) max(1, (int) ceil((time() - strtotime(gmdate('Y') . '-01-01')) / 86400));
        case '1A':  return '365';
        case '5A':  return '1825';
        case 'MAX': return 'max';
        default:    return '30';
    }
}

function btc_quote(): array {
    $j = http_get_json(COINGECKO . '/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', 6);
    $usd = $j['bitcoin']['usd'] ?? null;
    $pct = isset($j['bitcoin']['usd_24h_change']) ? round((float) $j['bitcoin']['usd_24h_change'], 2) : null;
    $prev = ($usd !== null && $pct !== null && (1 + $pct / 100) != 0) ? $usd / (1 + $pct / 100) : null;
    return [
        'current'    => $usd !== null ? (float) $usd : null,
        'prev_close' => $prev !== null ? round($prev, 2) : null,
        'change_abs' => ($usd !== null && $prev !== null) ? round($usd - $prev, 2) : null,
        'change_pct' => $pct,
        'ts'         => time() * 1000,
    ];
}

function btc_series(string $range): array {
    $days = btc_days($range);
    $j = http_get_json(COINGECKO . "/coins/bitcoin/market_chart?vs_currency=usd&days={$days}", 9);
    if (!$j || empty($j['prices'])) return ['points' => [], 'prev_close' => null, 'volume' => []];
    $points = [];
    foreach ($j['prices'] as $p) {
        if (is_array($p) && count($p) >= 2) $points[] = [(int) $p[0], round((float) $p[1], 2)];
    }
    $volume = [];
    if (!empty($j['total_volumes'])) {
        foreach ($j['total_volumes'] as $v) {
            if (is_array($v) && count($v) >= 2) $volume[] = [(int) $v[0], round((float) $v[1])];
        }
    }
    $prevClose = count($points) ? $points[0][1] : null;
    return ['points' => $points, 'prev_close' => $prevClose, 'volume' => $volume];
}

// CoinGecko /ohlc só aceita days em {1,7,14,30,90,180,365,max}
function btc_ohlc_days(string $range): string {
    switch ($range) {
        case '1D':  return '1';
        case '5D':  return '7';
        case '1M':  return '30';
        case '6M':  return '180';
        case 'YTD': return '365';
        case '1A':  return '365';
        case '5A':  return 'max';
        case 'MAX': return 'max';
        default:    return '30';
    }
}

function btc_ohlc(string $range): array {
    $days = btc_ohlc_days($range);
    $j = http_get_json(COINGECKO . "/coins/bitcoin/ohlc?vs_currency=usd&days={$days}", 9);
    if (!is_array($j)) return [];
    $out = [];
    foreach ($j as $c) {
        if (is_array($c) && count($c) >= 5) {
            $out[] = [(int) $c[0], round((float) $c[1], 2), round((float) $c[2], 2), round((float) $c[3], 2), round((float) $c[4], 2)];
        }
    }
    return $out;
}

// ----------------------------------------------------------------------------
// Dispatch
// ----------------------------------------------------------------------------
try {
    $cold = false;
    $volume = [];
    $candles = [];
    if ($cfg['kind'] === 'crypto') {
        $quote = btc_quote();
        $ser   = btc_series($range);
        $volume = downsample($ser['volume'] ?? [], MAX_POINTS);
        if ($wantOhlc) $candles = downsample(btc_ohlc($range), MAX_POINTS);
    } else {
        $base   = $cfg['fx_base'];
        $target = $cfg['fx_target'];
        $quote  = fx_quote($asset, $base, $target);
        if ($range === '1D') {
            $intr = fx_intraday_points($asset, $base, $target);
            $ser  = ['points' => $intr['points'], 'prev_close' => $quote['prev_close']];
            $cold = $intr['cold'];
        } else {
            $ser = fx_daily_series($base, $target, $range);
        }
    }

    $points = downsample($ser['points'], MAX_POINTS);
    $first = count($points) ? $points[0][1] : null;
    $last  = count($points) ? $points[count($points) - 1][1] : null;
    $rangeAbs = ($first !== null && $last !== null) ? $last - $first : null;
    $rangePct = ($rangeAbs !== null && $first) ? round(($rangeAbs / $first) * 100, 4) : null;

    $data = [
        'asset' => $asset,
        'pair'  => $cfg['pair'],
        'kind'  => $cfg['kind'],
        'range' => $range,
        'quote' => $quote,
        'series' => [
            'points'     => $points,
            'prev_close' => $ser['prev_close'] !== null ? (float) $ser['prev_close'] : null,
            'first'      => $first,
            'last'       => $last,
            'change_abs' => $rangeAbs !== null ? round($rangeAbs, 4) : null,
            'change_pct' => $rangePct,
            'direction'  => ($rangeAbs === null) ? 'flat' : ($rangeAbs >= 0 ? 'up' : 'down'),
            'volume'     => $volume,
        ],
        'candles'    => $candles,
        'has_ohlc'   => ($cfg['kind'] === 'crypto'),
        'has_volume' => ($cfg['kind'] === 'crypto'),
        'updated_at' => gmdate('c'),
    ];
    $meta = ['version' => '1.1.0', 'count' => count($points), 'cold' => $cold,
             'source' => $cfg['kind'] === 'crypto' ? 'coingecko' : ($range === '1D' ? 'redis-intraday+frankfurter' : 'frankfurter')];

    if (empty($points)) {
        ApiResponse::success($data, $meta + ['warning' => 'no_points']);
    }

    $out = ApiResponse::buildSuccess($data, $meta);
    if ($isFxIntraday) {
        header('Content-Type: application/json; charset=utf-8');
        echo $out;
        RedisHelper::close();
    } else {
        RedisHelper::cacheAndReturn($CACHE_KEY, $out, $CACHE_TTL);
    }

} catch (\Throwable $e) {
    error_log('[currency:history] ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'history_failed']);
}
