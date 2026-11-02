<?php
/**
 * TomTomTrafficProvider - implementação real (ativada quando TOMTOM_TRAFFIC_API_KEY existir).
 * @version 1.0.0
 * @description Fluxo: Flow Segment Data v4 (uma amostra por VIA MONITORADA — nº de chamadas
 *   limitado à lista de vias, para caber no plano gratuito). Ocorrências: Incident Details v5
 *   (UMA chamada por bbox). A chave é injetada server-side; nunca vai ao frontend.
 *
 *   ⚠️ ORÇAMENTO DE CHAMADAS: cada refresh de fluxo faz N chamadas (N = nº de vias). Com o
 *   cache de 60s isso pode estourar o free tier — antes do go-live, ajustar TTL/nº de vias
 *   em config.php (ver README, seção "limites da API").
 */

require_once __DIR__ . '/TrafficProvider.php';
require_once __DIR__ . '/../models/TrafficModels.php';
require_once __DIR__ . '/../lib/http.php';

if (!class_exists('TomTomTrafficProvider')) {
final class TomTomTrafficProvider implements TrafficProvider {

    private string $key;
    private array $cfg;

    public function __construct(string $apiKey, array $cfg) {
        $this->key = $apiKey;
        $this->cfg = $cfg;
    }

    public function name(): string { return 'tomtom'; }

    public function health(): array {
        // Ping barato: uma consulta de fluxo no centro da cidade.
        $c = $this->cfg['center'];
        $seg = $this->flowAtPoint((float)$c['lat'], (float)$c['lng']);
        return $seg === null
            ? ['status' => 'down', 'detail' => 'flow endpoint sem resposta']
            : ['status' => 'up', 'detail' => 'ok'];
    }

    /** Uma via monitorada = um ponto de amostra (midpoint da geometria da via). */
    public function getTrafficFlow(array $bounds): array {
        $roads = require __DIR__ . '/fixtures/sp-roads.php'; // reusa a lista de vias monitoradas
        $out = [];
        foreach ($roads as $r) {
            $coords = $r['geometry']['coordinates'];
            $mid = $coords[(int)floor(count($coords) / 2)];
            $raw = $this->flowAtPoint((float)$mid[1], (float)$mid[0]);
            if ($raw === null) continue;
            $f = $raw['flowSegmentData'] ?? null;
            if (!is_array($f)) continue;

            // Geometria: usa a da TomTom se vier; senão a da via monitorada.
            $geom = $r['geometry'];
            if (!empty($f['coordinates']['coordinate']) && is_array($f['coordinates']['coordinate'])) {
                $line = [];
                foreach ($f['coordinates']['coordinate'] as $pt) {
                    if (isset($pt['longitude'], $pt['latitude'])) $line[] = [(float)$pt['longitude'], (float)$pt['latitude']];
                }
                if (count($line) >= 2) $geom = ['type' => 'LineString', 'coordinates' => self::simplifyLine($line, 48)];
            }

            $out[] = TrafficModels::flowSegment([
                'id'                        => $r['id'],
                'roadName'                  => $r['road'],
                'currentSpeedKmh'           => isset($f['currentSpeed']) ? (float)$f['currentSpeed'] : null,
                'freeFlowSpeedKmh'          => isset($f['freeFlowSpeed']) ? (float)$f['freeFlowSpeed'] : null,
                'currentTravelTimeSeconds'  => isset($f['currentTravelTime']) ? (int)$f['currentTravelTime'] : null,
                'freeFlowTravelTimeSeconds' => isset($f['freeFlowTravelTime']) ? (int)$f['freeFlowTravelTime'] : null,
                'confidence'                => isset($f['confidence']) ? (float)$f['confidence'] : null,
                'roadClosure'               => !empty($f['roadClosure']),
                'geometry'                  => $geom,
                'updatedAt'                 => gmdate('c'),
            ]);
        }
        return $out;
    }

    private function flowAtPoint(float $lat, float $lng): ?array {
        $t = $this->cfg['tomtom'];
        $url = $t['base_url'] . $t['endpoints']['flow_segment']
            . '?point=' . rawurlencode($lat . ',' . $lng)
            . '&unit=KMPH'
            . '&key=' . rawurlencode($this->key);
        return traffic_http_get_json($url, (int)$t['timeout_flow']);
    }

    /** Uma chamada por bbox → todas as ocorrências. */
    public function getIncidents(array $bounds): array {
        $t = $this->cfg['tomtom'];
        // bbox TomTom: minLon,minLat,maxLon,maxLat
        $bbox = $bounds['west'] . ',' . $bounds['south'] . ',' . $bounds['east'] . ',' . $bounds['north'];
        $fields = rawurlencode('{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers}}}');
        $url = $t['base_url'] . $t['endpoints']['incident_details']
            . '?bbox=' . rawurlencode($bbox)
            . '&fields=' . $fields
            . '&language=' . rawurlencode($t['language'])
            . '&timeValidityFilter=present'
            . '&key=' . rawurlencode($this->key);

        $raw = traffic_http_get_json($url, (int)$t['timeout_incidents']);
        if ($raw === null || empty($raw['incidents'])) return [];

        $out = [];
        foreach ($raw['incidents'] as $i => $feat) {
            $p = $feat['properties'] ?? [];
            $ev = $p['events'][0] ?? [];
            $out[] = TrafficModels::incident([
                'id'           => 'tt-' . ($p['id'] ?? $i),
                'type'         => self::mapType((int)($p['iconCategory'] ?? $ev['iconCategory'] ?? 0)),
                'title'        => $ev['description'] ?? 'Ocorrência de trânsito',
                'description'  => $ev['description'] ?? null,
                // roadNumbers costuma vir vazio em vias urbanas → usa 'from' (referência da via) como nome.
                'roadName'     => (!empty($p['roadNumbers']) && is_array($p['roadNumbers'])) ? implode(', ', $p['roadNumbers']) : ($p['from'] ?? null),
                'from'         => $p['from'] ?? null,
                'to'           => $p['to'] ?? null,
                'direction'    => null,
                'severity'     => self::mapSeverity((int)($p['magnitudeOfDelay'] ?? 0)),
                'delaySeconds' => isset($p['delay']) ? (int)$p['delay'] : null,
                'lengthMeters' => isset($p['length']) ? (float)$p['length'] : null,
                'startTime'    => $p['startTime'] ?? null,
                'endTime'      => $p['endTime'] ?? null,
                // Ocorrência é exibida como MARCADOR (ponto) → reduz a geometria a 1 ponto (payload leve).
                'geometry'     => self::pointFromGeom($feat['geometry'] ?? null),
                'updatedAt'    => gmdate('c'),
            ]);
        }
        return $out;
    }

    /** Amostra uma polyline p/ no máx $max pontos (mantém extremos) — reduz payload sem perder a forma. */
    private static function simplifyLine(array $coords, int $max): array {
        $n = count($coords);
        if ($n <= $max) return $coords;
        $step = ($n - 1) / ($max - 1);
        $out = [];
        for ($i = 0; $i < $max; $i++) { $out[] = $coords[(int)round($i * $step)]; }
        $out[$max - 1] = $coords[$n - 1];
        return $out;
    }

    /** Reduz qualquer geometria a um Point [lng,lat] (primeira coordenada). */
    private static function pointFromGeom($g): ?array {
        if (!is_array($g)) return null;
        $t = $g['type'] ?? '';
        $c = $g['coordinates'] ?? null;
        if ($t === 'Point' && is_array($c) && count($c) >= 2) return ['type' => 'Point', 'coordinates' => [(float)$c[0], (float)$c[1]]];
        if ($t === 'LineString' && is_array($c) && isset($c[0][0])) return ['type' => 'Point', 'coordinates' => [(float)$c[0][0], (float)$c[0][1]]];
        if ($t === 'MultiLineString' && is_array($c) && isset($c[0][0][0])) return ['type' => 'Point', 'coordinates' => [(float)$c[0][0][0], (float)$c[0][0][1]]];
        return null;
    }

    /** TomTom iconCategory → nosso tipo. */
    private static function mapType(int $cat): string {
        // 0 unknown,1 accident,2 fog,3 dangerous cond,4 rain,5 ice,6 jam,7 lane closed,
        // 8 road closed,9 road works,10 wind,11 flooding,14 broken vehicle
        switch ($cat) {
            case 1:  return 'accident';
            case 6:  return 'congestion';
            case 7:
            case 8:  return 'closure';
            case 9:  return 'roadworks';
            case 2: case 3: case 4: case 5: case 10: case 11: case 14: return 'hazard';
            default: return 'other';
        }
    }

    /** magnitudeOfDelay → severidade. TomTom: 0=unknown,1=minor,2=moderate,3=major,4=undefined(fechado).
     *  mag=4 (interdição/indefinido) NÃO é "critical" por si só → mapeado como 'high' para não inflar. */
    private static function mapSeverity(int $mag): string {
        switch ($mag) {
            case 3: return 'high';
            case 4: return 'high';
            case 2: return 'moderate';
            default: return 'low';
        }
    }
}
}
