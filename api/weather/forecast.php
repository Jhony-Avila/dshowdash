<?php
/**
 * api/weather/forecast.php — previsão completa (atual + 10 dias + 48 h) para UMA coordenada, no formato do
 * /api/home/weather.php. Criado para o APP DSHOW (Paridade W-INT.1, Q-INT.2 = A): o app mostra a cidade do fuso
 * do aparelho (ex.: Shanghai em viagem) com a mesma riqueza da previsão de São Paulo.
 * @version 1.0.0  @created 2026-10-29
 *
 * POR QUE UM ENDPOINT NOVO: home/weather.php é fixo em São Paulo (nenhum $_GET) e bulk.php devolve só o clima ATUAL de
 * N pontos. Nenhum arquivo existente foi alterado.
 *
 * SEGURANÇA: a URL de destino é CONSTANTE; os únicos dados do cliente são dois números validados em faixa
 * (ForecastNormalizer::validarCoordenadas) — sem vetor de SSRF. Público e sem sessão, como bulk.php e home/weather.php
 * (dado meteorológico, nenhum dado pessoal).
 *
 * LIMITES: coordenadas arredondadas a 2 casas; cache Redis por coordenada, TTL 30 min (como o bulk.php) — N aparelhos na
 * mesma cidade custam 1 chamada à Open-Meteo a cada 30 min. Sem fallback em arquivo: em falha devolve 503
 * UPSTREAM_UNAVAILABLE e o consumidor (backend do app) serve o seu próprio "stale".
 *
 * CONTRATO: envelope oficial ApiResponse ({ok,data,error,meta}).
 *   GET /api/weather/forecast.php?lat=31.23&lng=121.47
 *   data: { cidade:null, lat, lng, fuso, offsetSegundos, atual{...}, dias[10], horas[48], atualizadoEm, desatualizado:false }
 *   (campos de atual/dias/horas = os do home/weather.php + `codigo` WMO)
 */

declare(strict_types=1);

require_once __DIR__ . '/../core/CorsPolicy.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/../_helpers/ApiResponse.php';
require_once __DIR__ . '/ForecastNormalizer.php';

CorsPolicy::setupApiEndpoint(['methods' => ['GET', 'OPTIONS'], 'no_cache' => false]);

const WFC_CACHE_TTL = 1800;               // 30 min (= bulk.php)
const WFC_OPENMETEO = 'https://api.open-meteo.com/v1/forecast';
const WFC_TIMEOUT   = 10;

// ===================== Entrada =====================

$ponto = ForecastNormalizer::validarCoordenadas($_GET['lat'] ?? null, $_GET['lng'] ?? null);
if ($ponto === null) {
    ApiResponse::error('VALIDATION_ERROR', 400, ['detail' => 'Parâmetros lat e lng obrigatórios: números em faixa (-90…90, -180…180)']);
}
[$lat, $lng] = $ponto;

// ===================== Cache =====================

$cacheKey = 'weather:forecast:' . sprintf('%.2f,%.2f', $lat, $lng);
if (RedisHelper::serveIfCached($cacheKey)) {
    exit;
}

// ===================== Open-Meteo =====================

$url = WFC_OPENMETEO . '?' . http_build_query(ForecastNormalizer::parametrosOpenMeteo($lat, $lng));

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => WFC_TIMEOUT,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_HTTPHEADER     => ['Accept: application/json', 'User-Agent: DshowDash/1.0 (weather-forecast)'],
]);
$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr !== '' || $httpCode !== 200 || !is_string($response)) {
    error_log('[weather:forecast] Open-Meteo falhou: ' . ($curlErr !== '' ? $curlErr : 'HTTP ' . $httpCode));
    ApiResponse::error('UPSTREAM_UNAVAILABLE', 503, ['detail' => 'Open-Meteo indisponível']);
}

$decoded = json_decode($response, true);
if (!ForecastNormalizer::respostaValida($decoded)) {
    error_log('[weather:forecast] resposta inválida da Open-Meteo');
    ApiResponse::error('UPSTREAM_UNAVAILABLE', 503, ['detail' => 'Resposta inválida da Open-Meteo']);
}

$dados = ForecastNormalizer::normalizar($decoded, $lat, $lng, date('c'));

// Sem flag "cached" no corpo (congelaria no Redis); a verdade do cache é o cabeçalho X-Cache e o `generated_at`.
$output = ApiResponse::buildSuccess($dados, [
    'fonte'        => 'open-meteo',
    'version'      => '1.0.0',
    'generated_at' => date('c'),
    'ttl'          => WFC_CACHE_TTL,
]);

RedisHelper::cacheAndReturn($cacheKey, $output, WFC_CACHE_TTL);
