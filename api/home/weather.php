<?php
/**
 * /api/home/weather.php — clima completo para a Home Inteligente (briefing §8–§9).
 * @version 1.0.0  @created 2026-07-29
 *
 * Fonte: Open-Meteo (mesma fonte gratuita já usada pelo dash em
 * /api/weather/get_sao_paulo.php), consultada NO SERVIDOR com cache em
 * arquivo (10 min) e fallback para o último payload válido em caso de erro.
 *
 * Entrega: atual detalhado (sensação, chuva, vento, umidade, UV, nuvens,
 * nascer/pôr do sol) + 10 dias + 48 h horárias. Envelope {ok,data,error,meta}.
 * Endpoint somente leitura e sem dados sensíveis (como o get_sao_paulo.php).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=300');

const WX_LAT = -23.5505;
const WX_LON = -46.6333;
const WX_TZ  = 'America/Sao_Paulo';
const WX_TTL = 600; // 10 min

$cacheFile = sys_get_temp_dir() . '/dshow-home-weather-v1.json';

function wx_out(bool $ok, $data, ?string $error = null): void
{
    echo json_encode([
        'ok'    => $ok,
        'data'  => $data,
        'error' => $error,
        'meta'  => ['fonte' => 'open-meteo', 'cidade' => 'São Paulo'],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Rótulo PT + grupo visual a partir do WMO weather code. */
function wx_condicao(int $code): array
{
    $mapa = [
        [[0], 'Céu limpo', 'limpo'],
        [[1], 'Predomínio de sol', 'limpo'],
        [[2], 'Parcialmente nublado', 'parcial'],
        [[3], 'Nublado', 'nublado'],
        [[45, 48], 'Neblina', 'neblina'],
        [[51, 53, 55, 56, 57], 'Garoa', 'chuva'],
        [[61, 63, 65, 66, 67], 'Chuva', 'chuva'],
        [[71, 73, 75, 77], 'Neve', 'neve'],
        [[80, 81, 82], 'Pancadas de chuva', 'chuva'],
        [[85, 86], 'Pancadas de neve', 'neve'],
        [[95, 96, 99], 'Tempestade', 'tempestade'],
    ];
    foreach ($mapa as [$codes, $rotulo, $grupo]) {
        if (in_array($code, $codes, true)) {
            return [$rotulo, $grupo];
        }
    }
    return ['Indefinido', 'parcial'];
}

// ── cache ───────────────────────────────────────────────────────────
$agora = time();
$cache = null;
if (is_file($cacheFile)) {
    $bruto = @file_get_contents($cacheFile);
    $cache = $bruto ? json_decode($bruto, true) : null;
}
if (is_array($cache) && isset($cache['ts'], $cache['data']) && ($agora - (int) $cache['ts']) < WX_TTL) {
    wx_out(true, $cache['data']);
}

// ── consulta Open-Meteo ─────────────────────────────────────────────
$url = 'https://api.open-meteo.com/v1/forecast'
    . '?latitude=' . WX_LAT . '&longitude=' . WX_LON
    . '&timezone=' . rawurlencode(WX_TZ)
    . '&forecast_days=10'
    . '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,'
    . 'wind_speed_10m,precipitation,cloud_cover,is_day'
    . '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,'
    . 'apparent_temperature_min,precipitation_probability_max,precipitation_sum,'
    . 'wind_speed_10m_max,uv_index_max,sunrise,sunset'
    . '&hourly=temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m'
    . '&forecast_hours=48';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 8,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_USERAGENT      => 'DshowDash-Home/1.0',
]);
$resposta = curl_exec($ch);
$http = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$bruto = ($resposta !== false && $http === 200) ? json_decode((string) $resposta, true) : null;

if (!is_array($bruto) || !isset($bruto['current'], $bruto['daily'])) {
    // fallback: serve o último válido, mesmo vencido (marcado como desatualizado)
    if (is_array($cache) && isset($cache['data'])) {
        $velho = $cache['data'];
        $velho['desatualizado'] = true;
        wx_out(true, $velho);
    }
    wx_out(false, null, 'WEATHER_UNAVAILABLE');
}

// ── normalização ────────────────────────────────────────────────────
$c = $bruto['current'];
$d = $bruto['daily'];
$h = $bruto['hourly'] ?? [];

[$condAtual, $grupoAtual] = wx_condicao((int) ($c['weather_code'] ?? -1));

$dias = [];
$n = count($d['time'] ?? []);
for ($i = 0; $i < $n; $i++) {
    [$rot, $grp] = wx_condicao((int) ($d['weather_code'][$i] ?? -1));
    $dias[] = [
        'data'          => $d['time'][$i],
        'condicao'      => $rot,
        'grupo'         => $grp,
        'tempMax'       => $d['temperature_2m_max'][$i] ?? null,
        'tempMin'       => $d['temperature_2m_min'][$i] ?? null,
        'sensacaoMax'   => $d['apparent_temperature_max'][$i] ?? null,
        'sensacaoMin'   => $d['apparent_temperature_min'][$i] ?? null,
        'chanceChuva'   => $d['precipitation_probability_max'][$i] ?? null,
        'volumeChuva'   => $d['precipitation_sum'][$i] ?? null,
        'ventoMax'      => $d['wind_speed_10m_max'][$i] ?? null,
        'uvMax'         => $d['uv_index_max'][$i] ?? null,
        'nascerDoSol'   => $d['sunrise'][$i] ?? null,
        'porDoSol'      => $d['sunset'][$i] ?? null,
    ];
}

$horas = [];
$nh = count($h['time'] ?? []);
for ($i = 0; $i < $nh; $i++) {
    [$rot, $grp] = wx_condicao((int) ($h['weather_code'][$i] ?? -1));
    $horas[] = [
        'hora'        => $h['time'][$i],
        'temp'        => $h['temperature_2m'][$i] ?? null,
        'condicao'    => $rot,
        'grupo'       => $grp,
        'chanceChuva' => $h['precipitation_probability'][$i] ?? null,
        'volumeChuva' => $h['precipitation'][$i] ?? null,
        'vento'       => $h['wind_speed_10m'][$i] ?? null,
    ];
}

$hoje = $dias[0] ?? [];

$dados = [
    'cidade'        => 'São Paulo',
    'atual'         => [
        'temp'      => $c['temperature_2m'] ?? null,
        'sensacao'  => $c['apparent_temperature'] ?? null,
        'condicao'  => $condAtual,
        'grupo'     => $grupoAtual,
        'umidade'   => $c['relative_humidity_2m'] ?? null,
        'vento'     => $c['wind_speed_10m'] ?? null,
        'chuvaAgora'=> $c['precipitation'] ?? null,
        'nuvens'    => $c['cloud_cover'] ?? null,
        'dia'       => (bool) ($c['is_day'] ?? true),
        'tempMax'   => $hoje['tempMax'] ?? null,
        'tempMin'   => $hoje['tempMin'] ?? null,
        'chanceChuva' => $hoje['chanceChuva'] ?? null,
        'uvMax'     => $hoje['uvMax'] ?? null,
        'nascerDoSol' => $hoje['nascerDoSol'] ?? null,
        'porDoSol'  => $hoje['porDoSol'] ?? null,
    ],
    'dias'          => $dias,
    'horas'         => $horas,
    'atualizadoEm'  => date('c'),
    'desatualizado' => false,
];

@file_put_contents($cacheFile, json_encode(['ts' => $agora, 'data' => $dados], JSON_UNESCAPED_UNICODE), LOCK_EX);

wx_out(true, $dados);
