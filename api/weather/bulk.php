<?php
/**
 * api/weather/bulk.php — clima atual de várias coordenadas numa só chamada.
 * @version 1.0.0
 * @created 2026-07-30
 * @module  Relógio Mundial (panel-relogio-mundial)
 *
 * POR QUE UM ENDPOINT NOVO: get_sao_paulo.php é fixo numa cidade. O Relógio Mundial
 * precisa do clima de até 60 cidades ao mesmo tempo, e a Open-Meteo aceita listas de
 * coordenadas (latitude=a,b,c&longitude=x,y,z) devolvendo um array — 1 requisição em
 * vez de 60. Sem chave de API, sem custo.
 *
 * SEGURANÇA: a URL de destino é CONSTANTE (não vem do cliente), e os únicos dados que
 * o cliente injeta são números validados como coordenadas em faixa. Não há vetor de
 * SSRF: nem host, nem caminho, nem esquema são influenciáveis.
 *
 * LIMITES: no máximo 60 pontos por chamada; coordenadas arredondadas a 2 casas
 * (~1 km, resolução muito acima da grade do modelo) para maximizar acerto de cache.
 * Cache Redis por conjunto ordenado de coordenadas, TTL de 30 min — o clima não muda
 * mais rápido que isso e o cache protege a API externa de rajadas do painel.
 *
 * CONTRATO: envelope oficial ApiResponse ({ok,data,error,meta}).
 *   GET /api/weather/bulk.php?points=-23.55,-46.63;51.51,-0.13;35.68,139.69
 *   data: [ { lat, lng, temperature, feels_like, humidity, wind_speed,
 *             weather_code, condition, icon, is_day }, … ]  (mesma ordem da entrada)
 */

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

const WCM_MAX_POINTS  = 60;
const WCM_CACHE_TTL   = 1800;               // 30 min
const WCM_OPENMETEO   = 'https://api.open-meteo.com/v1/forecast';
const WCM_TIMEOUT     = 12;

// ===================== Entrada =====================

$raw = isset($_GET['points']) ? (string) $_GET['points'] : '';
if ($raw === '') {
    ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Parâmetro "points" obrigatório: lat,lng;lat,lng…']);
}

$pairs = array_filter(explode(';', $raw), static fn($s) => trim($s) !== '');
if (count($pairs) > WCM_MAX_POINTS) {
    ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Máximo de ' . WCM_MAX_POINTS . ' pontos por chamada']);
}

$lats = [];
$lngs = [];
foreach ($pairs as $pair) {
    $parts = explode(',', trim($pair));
    if (count($parts) !== 2) {
        ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Ponto malformado: ' . substr($pair, 0, 32)]);
    }
    // is_numeric barra qualquer coisa que não seja número — nada de string entra na URL.
    if (!is_numeric($parts[0]) || !is_numeric($parts[1])) {
        ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Coordenada não numérica']);
    }
    $lat = round((float) $parts[0], 2);
    $lng = round((float) $parts[1], 2);
    if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
        ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Coordenada fora de faixa']);
    }
    $lats[] = $lat;
    $lngs[] = $lng;
}

if (!$lats) {
    ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Nenhum ponto válido']);
}

// ===================== Cache =====================

$cacheKey = 'weather:bulk:' . substr(hash('sha256', implode(';', $lats) . '|' . implode(';', $lngs)), 0, 32);
if (RedisHelper::serveIfCached($cacheKey)) {
    exit;
}

// ===================== Open-Meteo =====================

/** Tradução dos WMO weather codes para pt-BR + ícone. */
function wcm_condition(int $code): array {
    static $map = [
        0  => ['Céu limpo', '☀️'],
        1  => ['Predomínio de sol', '🌤️'],
        2  => ['Parcialmente nublado', '⛅'],
        3  => ['Nublado', '☁️'],
        45 => ['Nevoeiro', '🌫️'],
        48 => ['Nevoeiro com geada', '🌫️'],
        51 => ['Garoa fraca', '🌦️'],
        53 => ['Garoa', '🌦️'],
        55 => ['Garoa intensa', '🌦️'],
        56 => ['Garoa congelante', '🌧️'],
        57 => ['Garoa congelante intensa', '🌧️'],
        61 => ['Chuva fraca', '🌧️'],
        63 => ['Chuva', '🌧️'],
        65 => ['Chuva forte', '🌧️'],
        66 => ['Chuva congelante', '🌧️'],
        67 => ['Chuva congelante forte', '🌧️'],
        71 => ['Neve fraca', '🌨️'],
        73 => ['Neve', '🌨️'],
        75 => ['Neve forte', '❄️'],
        77 => ['Grãos de neve', '🌨️'],
        80 => ['Pancadas isoladas', '🌦️'],
        81 => ['Pancadas de chuva', '🌧️'],
        82 => ['Pancadas fortes', '⛈️'],
        85 => ['Pancadas de neve', '🌨️'],
        86 => ['Pancadas de neve fortes', '❄️'],
        95 => ['Tempestade', '⛈️'],
        96 => ['Tempestade com granizo', '⛈️'],
        99 => ['Tempestade severa com granizo', '⛈️'],
    ];
    return $map[$code] ?? ['Indisponível', '🌡️'];
}

$url = WCM_OPENMETEO . '?' . http_build_query([
    'latitude'  => implode(',', $lats),
    'longitude' => implode(',', $lngs),
    'current'   => 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    'timezone'  => 'UTC',
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => WCM_TIMEOUT,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_HTTPHEADER     => ['Accept: application/json', 'User-Agent: DshowDash/1.0 (relogio-mundial)'],
]);
$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr !== '' || $httpCode !== 200) {
    error_log('[weather:bulk] Open-Meteo falhou: ' . ($curlErr !== '' ? $curlErr : 'HTTP ' . $httpCode));
    // Degradação honesta: 503 + motivo. O painel esconde a camada de clima em vez de
    // inventar temperatura — inventar dado é pior que não mostrar dado.
    ApiResponse::error('UPSTREAM_UNAVAILABLE', 503, [
        'detail' => 'Open-Meteo indisponível',
        'points' => count($lats),
    ]);
}

$decoded = json_decode($response, true);
if (!is_array($decoded)) {
    error_log('[weather:bulk] resposta não-JSON da Open-Meteo');
    ApiResponse::error('UPSTREAM_UNAVAILABLE', 503, ['detail' => 'Resposta inválida da Open-Meteo']);
}

// Com 1 ponto a Open-Meteo devolve OBJETO; com 2+ devolve ARRAY. Normalizamos.
$items = isset($decoded['current']) ? [$decoded] : $decoded;

$out = [];
foreach ($items as $i => $item) {
    $cur = $item['current'] ?? null;
    if (!is_array($cur)) {
        continue;
    }
    $code = (int) ($cur['weather_code'] ?? 0);
    [$condition, $icon] = wcm_condition($code);
    $out[] = [
        'lat'          => $lats[$i] ?? (float) ($item['latitude'] ?? 0),
        'lng'          => $lngs[$i] ?? (float) ($item['longitude'] ?? 0),
        'temperature'  => isset($cur['temperature_2m']) ? round((float) $cur['temperature_2m'], 1) : null,
        'feels_like'   => isset($cur['apparent_temperature']) ? round((float) $cur['apparent_temperature'], 1) : null,
        'humidity'     => isset($cur['relative_humidity_2m']) ? (int) $cur['relative_humidity_2m'] : null,
        'wind_speed'   => isset($cur['wind_speed_10m']) ? round((float) $cur['wind_speed_10m'], 1) : null,
        'weather_code' => $code,
        'condition'    => $condition,
        'icon'         => $icon,
        'is_day'       => isset($cur['is_day']) ? (bool) $cur['is_day'] : null,
    ];
}

// NÃO existe campo "cached" aqui de propósito: o corpo é gravado no Redis como está,
// então qualquer flag booleana ficaria congelada em "false" e MENTIRIA nos acertos de
// cache (é o que acontece em get_sao_paulo.php). A verdade sobre cache é o cabeçalho
// X-Cache: HIT|MISS, emitido pelo RedisHelper, e `generated_at` diz quando o dado
// realmente veio da Open-Meteo.
$output = ApiResponse::buildSuccess($out, [
    'points'       => count($out),
    'source'       => 'open-meteo',
    'version'      => '1.0.0',
    'generated_at' => date('c'),
    'ttl'          => WCM_CACHE_TTL,
]);

RedisHelper::cacheAndReturn($cacheKey, $output, WCM_CACHE_TTL);
