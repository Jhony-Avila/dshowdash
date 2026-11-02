<?php
/**
 * MockTrafficProvider - provedor de trânsito baseado em fixtures de São Paulo.
 * @version 1.0.0
 * @description Ativo enquanto não houver TOMTOM_TRAFFIC_API_KEY. Retorna dados JÁ
 *   normalizados (modelos internos), com variação por HORÁRIO (picos manhã/tarde) para
 *   a interface parecer "ao vivo". Determinístico dentro do mesmo minuto (cache-friendly).
 *   NÃO são dados oficiais.
 */

require_once __DIR__ . '/TrafficProvider.php';
require_once __DIR__ . '/../models/TrafficModels.php';

if (!class_exists('MockTrafficProvider')) {
final class MockTrafficProvider implements TrafficProvider {

    public function name(): string { return 'mock'; }
    public function health(): array { return ['status' => 'up', 'detail' => 'mock fixtures']; }

    /** Fator de congestionamento por horário local (SP): 0.2 (madrugada) a 1.0 (pico). */
    private function timeFactor(): float {
        try { $now = new DateTime('now', new DateTimeZone('America/Sao_Paulo')); }
        catch (\Throwable $e) { $now = new DateTime('now'); }
        $h = (int)$now->format('G');
        $wd = (int)$now->format('N'); // 1..7
        if ($wd >= 6) { // fim de semana: mais leve
            return ($h >= 12 && $h <= 20) ? 0.5 : 0.28;
        }
        if ($h >= 7 && $h <= 10) return 1.0;   // pico manhã
        if ($h >= 17 && $h <= 20) return 1.0;  // pico tarde
        if ($h >= 11 && $h <= 16) return 0.62; // entre-picos
        if ($h >= 21 && $h <= 23) return 0.4;
        return 0.2;                            // madrugada
    }

    private static function haversine(array $a, array $b): float {
        $R = 6371000.0;
        $lat1 = deg2rad((float)$a[1]); $lat2 = deg2rad((float)$b[1]);
        $dLat = $lat2 - $lat1; $dLng = deg2rad((float)$b[0] - (float)$a[0]);
        $h = sin($dLat/2)**2 + cos($lat1)*cos($lat2)*sin($dLng/2)**2;
        return 2 * $R * asin(min(1.0, sqrt($h)));
    }

    private static function lineLength(array $geom): float {
        $c = $geom['coordinates'] ?? []; $s = 0.0;
        for ($i = 1; $i < count($c); $i++) $s += self::haversine($c[$i-1], $c[$i]);
        return $s;
    }

    private static function inBounds(float $lat, float $lng, array $b): bool {
        return $lat <= $b['north'] && $lat >= $b['south'] && $lng >= $b['west'] && $lng <= $b['east'];
    }

    public function getTrafficFlow(array $bounds): array {
        $roads = require __DIR__ . '/fixtures/sp-roads.php';
        $factor = $this->timeFactor();
        $minuteSeed = (int)floor(time() / 60);
        $updatedAt = gmdate('c');
        $out = [];

        foreach ($roads as $r) {
            // filtro por bounds (usa 1º ponto da geometria)
            $p0 = $r['geometry']['coordinates'][0];
            if (!self::inBounds((float)$p0[1], (float)$p0[0], $bounds)) continue;

            // jitter determinístico por via+minuto (±0.12)
            $jitter = ((crc32($r['id'] . ':' . $minuteSeed) % 25) - 12) / 100.0;
            $cong = max(0.0, min(0.95, (float)$r['baseCongestion'] * $factor + $jitter));

            $free = (float)$r['freeFlowKmh'];
            $cur  = max(3.0, round($free * (1 - $cong), 1));
            $len  = self::lineLength($r['geometry']);
            $freeTt = $free > 0 ? (int)round($len / ($free / 3.6)) : null;   // s
            $curTt  = $cur  > 0 ? (int)round($len / ($cur  / 3.6)) : null;   // s

            $out[] = TrafficModels::flowSegment([
                'id'                        => $r['id'],
                'roadName'                  => $r['road'],
                'currentSpeedKmh'           => $cur,
                'freeFlowSpeedKmh'          => $free,
                'currentTravelTimeSeconds'  => $curTt,
                'freeFlowTravelTimeSeconds' => $freeTt,
                'confidence'                => 0.9,
                'roadClosure'               => false,
                'lengthMeters'              => round($len, 1),
                'geometry'                  => $r['geometry'],
                'updatedAt'                 => $updatedAt,
            ]);
        }
        return $out;
    }

    public function getIncidents(array $bounds): array {
        $items = require __DIR__ . '/fixtures/sp-incidents.php';
        $now = time();
        $out = [];
        foreach ($items as $it) {
            if (!self::inBounds((float)$it['lat'], (float)$it['lng'], $bounds)) continue;
            $start = isset($it['offsetMinStart']) ? gmdate('c', $now + (int)$it['offsetMinStart'] * 60) : null;
            $end   = isset($it['offsetMinEnd']) && $it['offsetMinEnd'] !== null ? gmdate('c', $now + (int)$it['offsetMinEnd'] * 60) : null;
            $out[] = TrafficModels::incident([
                'id'           => $it['id'],
                'type'         => $it['type'],
                'title'        => $it['title'],
                'description'  => $it['description'] ?? null,
                'roadName'     => $it['road'] ?? null,
                'from'         => $it['from'] ?? null,
                'to'           => $it['to'] ?? null,
                'direction'    => $it['direction'] ?? null,
                'severity'     => $it['severity'] ?? 'low',
                'delaySeconds' => $it['delaySeconds'] ?? null,
                'lengthMeters' => $it['lengthMeters'] ?? null,
                'startTime'    => $start,
                'endTime'      => $end,
                'geometry'     => ['type' => 'Point', 'coordinates' => [(float)$it['lng'], (float)$it['lat']]],
                'updatedAt'    => gmdate('c'),
            ]);
        }
        return $out;
    }
}
}
