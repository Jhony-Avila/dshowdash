<?php
/**
 * TrafficIndex - cálculo do índice geral, km de lentidão, comparação e tendência.
 * @version 1.0.0
 * @description Índice INTERNO e documentado (a API não fornece um índice único da cidade).
 *   Fórmula (ver README):
 *     segmentScore   = clamp(1 - current/freeFlow, 0..1) * 100
 *     cityBaseScore  = Σ(segmentScore * len) / Σ(len)                (média ponderada por extensão)
 *     incidentPenalty= closures*wC + severeAccidents*wA + majorWorks*wW   (com teto)
 *     trafficIndex   = min(100, cityBaseScore + incidentPenalty)
 */

if (!class_exists('TrafficIndex')) {
final class TrafficIndex {

    /** Haversine entre dois pontos [lng,lat] → metros. */
    private static function haversine(array $a, array $b): float {
        $R = 6371000.0;
        $lat1 = deg2rad((float)$a[1]); $lat2 = deg2rad((float)$b[1]);
        $dLat = $lat2 - $lat1;
        $dLng = deg2rad((float)$b[0] - (float)$a[0]);
        $h = sin($dLat/2)**2 + cos($lat1)*cos($lat2)*sin($dLng/2)**2;
        return 2 * $R * asin(min(1.0, sqrt($h)));
    }

    /** Comprimento de um segmento: usa lengthMeters se houver; senão soma a geometria. */
    public static function segmentLength(array $seg): float {
        if (isset($seg['lengthMeters']) && $seg['lengthMeters'] > 0) {
            return (float)$seg['lengthMeters'];
        }
        $g = $seg['geometry'] ?? null;
        if (is_array($g) && ($g['type'] ?? '') === 'LineString' && is_array($g['coordinates'] ?? null)) {
            $coords = $g['coordinates'];
            $sum = 0.0;
            for ($i = 1; $i < count($coords); $i++) {
                $sum += self::haversine($coords[$i-1], $coords[$i]);
            }
            return $sum;
        }
        return 0.0;
    }

    /**
     * Calcula o TrafficSummary a partir de flow[] + incidents[].
     * @param array $flow      Lista de TrafficFlowSegment normalizados
     * @param array $incidents Lista de TrafficIncident normalizados
     * @param array $cfg       config.php
     * @param float|null $prevIndex Índice anterior (para tendência); null se desconhecido
     */
    public static function computeSummary(array $flow, array $incidents, array $cfg, ?float $prevIndex): array {
        $ratio = (float)$cfg['index']['congestion_speed_ratio'];

        $wScoreLen = 0.0; $totLen = 0.0;      // média ponderada do score
        $sumCurLen = 0.0; $sumFreeLen = 0.0;  // médias ponderadas de velocidade
        $congestionMeters = 0.0;
        $congestedSegmentCount = 0;   // segmentos de fluxo abaixo do limiar (mesma fonte do km de fluxo)
        $seenIds = [];

        foreach ($flow as $seg) {
            $len = self::segmentLength($seg);
            $cur = $seg['currentSpeedKmh'] ?? null;
            $free = $seg['freeFlowSpeedKmh'] ?? null;

            if ($free !== null && $free > 0 && $cur !== null && $len > 0) {
                $cong = max(0.0, min(1.0, 1 - ($cur / $free)));
                $wScoreLen += ($cong * 100.0) * $len;
                $totLen    += $len;
                $sumCurLen  += $cur * $len;
                $sumFreeLen += $free * $len;

                // km de lentidão (dedup por id)
                $id = $seg['id'] ?? '';
                $isCongested = !empty($seg['roadClosure']) || ($cur < $free * $ratio);
                if ($isCongested && ($id === '' || !isset($seenIds[$id]))) {
                    $congestionMeters += $len;
                    $congestedSegmentCount++;
                    if ($id !== '') $seenIds[$id] = true;
                }
            }
        }

        $cityBase = $totLen > 0 ? ($wScoreLen / $totLen) : null;
        $avgCur   = $totLen > 0 ? ($sumCurLen / $totLen) : null;
        $avgFree  = $totLen > 0 ? ($sumFreeLen / $totLen) : null;

        // Contagem de ocorrências + extensão de congestionamento vinda dos incidentes.
        // Encerradas (status='ended') NÃO entram em nenhuma contagem ativa nem na penalidade
        // (§3.3: registros encerrados não influenciam o card de ocorrências ativas).
        $closures = 0; $accidents = 0; $roadworks = 0; $congestion = 0; $hazard = 0; $other = 0;
        $severeAccidents = 0; $majorWorks = 0;
        $congIncMeters = 0.0;
        $activeCount = 0; $endedCount = 0;
        foreach ($incidents as $inc) {
            if (($inc['status'] ?? 'active') === 'ended') { $endedCount++; continue; }
            $activeCount++;
            switch ($inc['type']) {
                case 'closure':   $closures++;  break;
                case 'accident':  $accidents++; if (($inc['severity'] ?? '') === 'critical' || ($inc['severity'] ?? '') === 'high') $severeAccidents++; break;
                case 'roadworks': $roadworks++; if (($inc['severity'] ?? '') === 'critical' || ($inc['severity'] ?? '') === 'high') $majorWorks++; break;
                case 'congestion': $congestion++; if (!empty($inc['lengthMeters'])) $congIncMeters += (float)$inc['lengthMeters']; break;
                case 'hazard':    $hazard++;    break;
                default:          $other++;     break;
            }
        }

        // Penalidade por ocorrências (com teto)
        $ic = $cfg['index'];
        $penalty = $closures * $ic['closure_penalty']
                 + $severeAccidents * $ic['severe_accident_penalty']
                 + $majorWorks * $ic['major_roadwork_penalty'];
        $penalty = min((float)$ic['max_incident_penalty'], $penalty);

        $index = ($cityBase === null) ? null : (float)min(100.0, $cityBase + $penalty);

        // Redução de velocidade e comparação vs fluxo livre (sem histórico: referência = free-flow).
        $speedReduction = ($avgFree !== null && $avgFree > 0 && $avgCur !== null)
            ? (($avgFree - $avgCur) / $avgFree) * 100.0 : null;
        $comparison = $speedReduction; // 1ª versão: comparação = quão pior que o fluxo livre

        // Tendência
        $trend = 'unknown';
        if ($index !== null && $prevIndex !== null) {
            $d = $index - $prevIndex;
            if ($d > 3)      $trend = 'worsening';
            elseif ($d < -3) $trend = 'improving';
            else             $trend = 'stable';
        }

        // Km de lentidão = segmentos de fluxo congestionados + extensão dos incidentes de congestionamento.
        $totalCongMeters = $congestionMeters + $congIncMeters;
        $kmAvailable = ($totLen > 0) || ($congIncMeters > 0);

        return [
            'trafficIndex'              => $index === null ? null : (int)round($index),
            'level'                     => self::levelFor($index, $cfg),
            'estimatedCongestionKm'     => $kmAvailable ? round($totalCongMeters / 1000.0, 1) : null,
            // Contagem de segmentos de FLUXO abaixo do limiar (mesma fonte de $congestionMeters).
            // null quando não há dados de fluxo → o front mostra "Segmentos não calculados",
            // nunca "0 segmentos" ao lado de um km que veio de ocorrências (§3.1/§8.2).
            'congestedSegmentCount'     => $totLen > 0 ? $congestedSegmentCount : null,
            'averageCurrentSpeedKmh'    => $avgCur === null ? null : round($avgCur, 1),
            'averageFreeFlowSpeedKmh'   => $avgFree === null ? null : round($avgFree, 1),
            'speedReductionPercentage'  => $speedReduction === null ? null : round($speedReduction, 1),
            // Composição COMPLETA (§3.2: a soma das categorias tem de fechar com o total).
            'activeIncidents'           => $activeCount,
            'endedIncidents'            => $endedCount,
            'closures'                  => $closures,
            'accidents'                 => $accidents,
            'roadworks'                 => $roadworks,
            'congestion'                => $congestion,
            'hazard'                    => $hazard,
            'other'                     => $other,
            'comparisonPercentage'      => $comparison === null ? null : round($comparison, 1),
            'comparisonBasis'           => 'free-flow', // não é média histórica
            'trend'                     => $trend,
            'updatedAt'                 => gmdate('c'),
        ];
    }

    /** Classifica o índice em normal|moderate|intense|unavailable. */
    public static function levelFor(?float $index, array $cfg): string {
        if ($index === null) return 'unavailable';
        $L = $cfg['levels'];
        if ($index <= $L['normal']['max'])   return 'normal';
        if ($index <= $L['moderate']['max']) return 'moderate';
        return 'intense';
    }
}
}
