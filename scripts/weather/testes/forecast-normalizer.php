<?php
/**
 * scripts/weather/testes/forecast-normalizer.php — testes do ForecastNormalizer (puro; sem rede, sem Redis).
 * Fixture: fixtures/open-meteo-shanghai.json (resposta REAL da Open-Meteo capturada em 2026-10-29; dado público).
 * Uso: php scripts/weather/testes/forecast-normalizer.php   → exit 0 = tudo verde.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../../api/weather/ForecastNormalizer.php';

$falhas = 0;
$ok = 0;
function check(bool $cond, string $msg): void
{
    global $falhas, $ok;
    if ($cond) { $ok++; echo "[OK]   $msg\n"; } else { $falhas++; echo "[FALHA] $msg\n"; }
}

// 1) validação das coordenadas
check(ForecastNormalizer::validarCoordenadas('31.23', '121.47') === [31.23, 121.47], 'coordenadas válidas passam');
check(ForecastNormalizer::validarCoordenadas('31.2345678', '121.4712') === [31.23, 121.47], 'arredonda a 2 casas');
check(ForecastNormalizer::validarCoordenadas('-23.5505', '-46.6333') === [-23.55, -46.63], 'negativas (São Paulo) passam');
check(ForecastNormalizer::validarCoordenadas('abc', '1') === null, 'não numérico → inválido');
check(ForecastNormalizer::validarCoordenadas('91', '0') === null, 'lat fora de faixa → inválido');
check(ForecastNormalizer::validarCoordenadas('0', '-181') === null, 'lng fora de faixa → inválido');
check(ForecastNormalizer::validarCoordenadas(null, '1') === null, 'lat ausente → inválido');
check(ForecastNormalizer::validarCoordenadas('1', '') === null, 'lng vazio → inválido');
check(ForecastNormalizer::validarCoordenadas(['1'], '1') === null, 'array → inválido');
check(ForecastNormalizer::validarCoordenadas('1e400', '1') === null, 'infinito → inválido');

// 2) parâmetros da Open-Meteo: fuso automático, 10 dias, 48 h, mesmas variáveis do home/weather.php
$p = ForecastNormalizer::parametrosOpenMeteo(31.23, 121.47);
check($p['timezone'] === 'auto' && $p['forecast_days'] === 10 && $p['forecast_hours'] === 48, 'parâmetros: timezone=auto, 10 dias, 48 h');
check(str_contains($p['daily'], 'uv_index_max') && str_contains($p['daily'], 'sunrise') && str_contains($p['hourly'], 'precipitation_probability'), 'variáveis diárias/horárias completas');
$url = 'https://api.open-meteo.com/v1/forecast?' . http_build_query($p);
check(preg_match('#^https://api\.open-meteo\.com/v1/forecast\?[A-Za-z0-9_%=&.,+-]+$#', $url) === 1, 'URL só com caracteres seguros');

// 3) tabela de condições = a do home/weather.php
check(ForecastNormalizer::condicao(0) === ['Céu limpo', 'limpo'], 'código 0 → Céu limpo/limpo');
check(ForecastNormalizer::condicao(2) === ['Parcialmente nublado', 'parcial'], 'código 2 → parcial');
check(ForecastNormalizer::condicao(45) === ['Neblina', 'neblina'], 'código 45 → neblina');
check(ForecastNormalizer::condicao(81) === ['Pancadas de chuva', 'chuva'], 'código 81 → chuva');
check(ForecastNormalizer::condicao(99) === ['Tempestade', 'tempestade'], 'código 99 → tempestade');
check(ForecastNormalizer::condicao(-1) === ['Indefinido', 'parcial'], 'código desconhecido → Indefinido');
$home = @file_get_contents(__DIR__ . '/../../../api/home/weather.php');
check(is_string($home) && str_contains($home, "[[45, 48], 'Neblina', 'neblina']") && str_contains($home, "[[95, 96, 99], 'Tempestade', 'tempestade']"), 'tabela do home/weather.php continua a mesma (paridade de texto)');

// 4) normalização da fixture real
$bruto = json_decode((string) file_get_contents(__DIR__ . '/fixtures/open-meteo-shanghai.json'), true);
check(ForecastNormalizer::respostaValida($bruto), 'fixture é uma resposta válida');
$d = ForecastNormalizer::normalizar($bruto, 31.23, 121.47, '2026-10-29T12:30:00-03:00');
check($d['fuso'] === 'Asia/Shanghai' && $d['offsetSegundos'] === 28800, 'fuso e offset vêm da Open-Meteo');
check($d['lat'] === 31.23 && $d['lng'] === 121.47 && $d['cidade'] === null, 'lat/lng ecoados; cidade nula (nome é do app)');
check(count($d['dias']) === 10 && count($d['horas']) === 48, '10 dias e 48 horas');
check(array_keys($d['atual']) === ['temp','sensacao','condicao','grupo','codigo','umidade','vento','chuvaAgora','nuvens','dia','tempMax','tempMin','chanceChuva','uvMax','nascerDoSol','porDoSol'], 'atual com os campos do home/weather.php + codigo');
check(array_keys($d['dias'][0]) === ['data','condicao','grupo','codigo','tempMax','tempMin','sensacaoMax','sensacaoMin','chanceChuva','volumeChuva','ventoMax','uvMax','nascerDoSol','porDoSol'], 'dia com os campos do home/weather.php + codigo');
check(array_keys($d['horas'][0]) === ['hora','temp','condicao','grupo','codigo','chanceChuva','volumeChuva','vento'], 'hora com os campos do home/weather.php + codigo');
check(is_int($d['atual']['codigo']) && $d['atual']['condicao'] === ForecastNormalizer::condicao($d['atual']['codigo'])[0], 'codigo/condicao coerentes no atual');
check($d['atual']['tempMax'] === $d['dias'][0]['tempMax'] && $d['atual']['nascerDoSol'] === $d['dias'][0]['nascerDoSol'], 'atual herda máx/mín/nascer do dia 0 (como o home)');
check(preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $d['dias'][0]['data']) === 1 && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/', (string) $d['horas'][0]['hora']) === 1, 'datas locais sem offset (o consumidor acrescenta pelo offsetSegundos)');
check($d['atualizadoEm'] === '2026-10-29T12:30:00-03:00' && $d['desatualizado'] === false, 'atualizadoEm ecoado; desatualizado false');
check(is_bool($d['atual']['dia']), 'dia é booleano');

// 5) dados incompletos → null, nunca 0; sem hourly → horas vazias
$parcial = ['current' => ['weather_code' => 3], 'daily' => ['time' => ['2026-10-29']], 'timezone' => 'UTC', 'utc_offset_seconds' => 0];
$d2 = ForecastNormalizer::normalizar($parcial, 0.0, 0.0, '2026-10-29T12:30:00+00:00');
check($d2['atual']['temp'] === null && $d2['atual']['umidade'] === null && $d2['dias'][0]['tempMax'] === null, 'valores ausentes → null');
check($d2['atual']['condicao'] === 'Nublado' && $d2['atual']['codigo'] === 3, 'condição do código 3');
check($d2['horas'] === [] && count($d2['dias']) === 1, 'sem hourly → horas vazias; 1 dia');
check(ForecastNormalizer::respostaValida(['daily' => []]) === false && ForecastNormalizer::respostaValida('x') === false && ForecastNormalizer::respostaValida(['current' => [], 'daily' => []]) === true, 'respostaValida exige current + daily');

echo "\n$ok ok · $falhas falha(s)\n";
exit($falhas === 0 ? 0 : 1);
