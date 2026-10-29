<?php
/**
 * api/weather/ForecastNormalizer.php — funções PURAS do forecast.php (sem rede, sem Redis, sem header): validação das
 * coordenadas, parâmetros da Open-Meteo e normalização da resposta para o MESMO formato do /api/home/weather.php
 * (atual + dias[10] + horas[48]), acrescido de fuso/offsetSegundos/lat/lng. Testado por scripts/weather/testes/.
 * @version 1.0.0  @created 2026-10-29  (Paridade W-INT.1 do APP DSHOW, Q-INT.2 = A)
 */

declare(strict_types=1);

final class ForecastNormalizer
{
    public const DIAS = 10;
    public const HORAS = 48;

    /** Rótulo PT + grupo visual a partir do WMO weather code — TABELA IDÊNTICA à de /api/home/weather.php (paridade de texto). */
    public static function condicao(int $code): array
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

    /**
     * lat/lng vindos da query: só números em faixa; arredondados a 2 casas (~1 km; maximiza o acerto do cache, como o bulk.php).
     * Devolve [lat, lng] ou null se inválido. Nada que não seja número chega à URL da Open-Meteo.
     */
    public static function validarCoordenadas(mixed $lat, mixed $lng): ?array
    {
        if (!is_string($lat) || !is_string($lng) || $lat === '' || $lng === '') {
            return null;
        }
        if (!is_numeric($lat) || !is_numeric($lng)) {
            return null;
        }
        $la = round((float) $lat, 2);
        $lo = round((float) $lng, 2);
        if (!is_finite($la) || !is_finite($lo) || $la < -90 || $la > 90 || $lo < -180 || $lo > 180) {
            return null;
        }
        return [$la, $lo];
    }

    /** Mesmas variáveis do /api/home/weather.php; fuso automático da coordenada (a Open-Meteo devolve timezone + utc_offset_seconds). */
    public static function parametrosOpenMeteo(float $lat, float $lng): array
    {
        return [
            'latitude'       => $lat,
            'longitude'      => $lng,
            'timezone'       => 'auto',
            'forecast_days'  => self::DIAS,
            'forecast_hours' => self::HORAS,
            'current'        => 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,cloud_cover,is_day',
            'daily'          => 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset',
            'hourly'         => 'temperature_2m,weather_code,precipitation_probability,precipitation,wind_speed_10m',
        ];
    }

    /** A resposta serve? Precisa de current + daily como o home/weather.php exige. */
    public static function respostaValida(mixed $bruto): bool
    {
        return is_array($bruto) && isset($bruto['current'], $bruto['daily']) && is_array($bruto['current']) && is_array($bruto['daily']);
    }

    /** Resposta crua da Open-Meteo → formato do /api/home/weather.php (+ fuso, offsetSegundos, lat, lng). $agoraIso = date('c') do servidor. */
    public static function normalizar(array $bruto, float $lat, float $lng, string $agoraIso): array
    {
        $c = $bruto['current'];
        $d = $bruto['daily'];
        $h = is_array($bruto['hourly'] ?? null) ? $bruto['hourly'] : [];

        [$condAtual, $grupoAtual] = self::condicao((int) ($c['weather_code'] ?? -1));

        $dias = [];
        $n = count($d['time'] ?? []);
        for ($i = 0; $i < $n; $i++) {
            [$rot, $grp] = self::condicao((int) ($d['weather_code'][$i] ?? -1));
            $dias[] = [
                'data'        => $d['time'][$i],
                'condicao'    => $rot,
                'grupo'       => $grp,
                'codigo'      => self::inteiroOuNulo($d['weather_code'][$i] ?? null),
                'tempMax'     => $d['temperature_2m_max'][$i] ?? null,
                'tempMin'     => $d['temperature_2m_min'][$i] ?? null,
                'sensacaoMax' => $d['apparent_temperature_max'][$i] ?? null,
                'sensacaoMin' => $d['apparent_temperature_min'][$i] ?? null,
                'chanceChuva' => $d['precipitation_probability_max'][$i] ?? null,
                'volumeChuva' => $d['precipitation_sum'][$i] ?? null,
                'ventoMax'    => $d['wind_speed_10m_max'][$i] ?? null,
                'uvMax'       => $d['uv_index_max'][$i] ?? null,
                'nascerDoSol' => $d['sunrise'][$i] ?? null,
                'porDoSol'    => $d['sunset'][$i] ?? null,
            ];
        }

        $horas = [];
        $nh = count($h['time'] ?? []);
        for ($i = 0; $i < $nh; $i++) {
            [$rot, $grp] = self::condicao((int) ($h['weather_code'][$i] ?? -1));
            $horas[] = [
                'hora'        => $h['time'][$i],
                'temp'        => $h['temperature_2m'][$i] ?? null,
                'condicao'    => $rot,
                'grupo'       => $grp,
                'codigo'      => self::inteiroOuNulo($h['weather_code'][$i] ?? null),
                'chanceChuva' => $h['precipitation_probability'][$i] ?? null,
                'volumeChuva' => $h['precipitation'][$i] ?? null,
                'vento'       => $h['wind_speed_10m'][$i] ?? null,
            ];
        }

        $hoje = $dias[0] ?? [];

        return [
            'cidade'         => null,
            'lat'            => $lat,
            'lng'            => $lng,
            'fuso'           => is_string($bruto['timezone'] ?? null) ? $bruto['timezone'] : null,
            'offsetSegundos' => self::inteiroOuNulo($bruto['utc_offset_seconds'] ?? null),
            'atual'          => [
                'temp'        => $c['temperature_2m'] ?? null,
                'sensacao'    => $c['apparent_temperature'] ?? null,
                'condicao'    => $condAtual,
                'grupo'       => $grupoAtual,
                'codigo'      => self::inteiroOuNulo($c['weather_code'] ?? null),
                'umidade'     => $c['relative_humidity_2m'] ?? null,
                'vento'       => $c['wind_speed_10m'] ?? null,
                'chuvaAgora'  => $c['precipitation'] ?? null,
                'nuvens'      => $c['cloud_cover'] ?? null,
                'dia'         => (bool) ($c['is_day'] ?? true),
                'tempMax'     => $hoje['tempMax'] ?? null,
                'tempMin'     => $hoje['tempMin'] ?? null,
                'chanceChuva' => $hoje['chanceChuva'] ?? null,
                'uvMax'       => $hoje['uvMax'] ?? null,
                'nascerDoSol' => $hoje['nascerDoSol'] ?? null,
                'porDoSol'    => $hoje['porDoSol'] ?? null,
            ],
            'dias'           => $dias,
            'horas'          => $horas,
            'atualizadoEm'   => $agoraIso,
            'desatualizado'  => false,
        ];
    }

    private static function inteiroOuNulo(mixed $v): ?int
    {
        return is_int($v) || is_float($v) || (is_string($v) && is_numeric($v)) ? (int) $v : null;
    }
}
