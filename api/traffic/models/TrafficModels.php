<?php
/**
 * Traffic Models - construtores/normalizadores dos modelos internos.
 * @version 1.0.0
 * @description Espelha as interfaces TS do briefing (TrafficFlowSegment, TrafficIncident,
 *   TrafficSummary). Nenhuma resposta bruta de provedor sai daqui para o frontend.
 */

if (!class_exists('TrafficModels')) {
final class TrafficModels {

    /** Classifica o nível de congestionamento de um segmento a partir da razão de velocidade. */
    public static function congestionLevel(?float $current, ?float $freeFlow, bool $closed): string {
        if ($closed) return 'critical';
        if ($current === null || $freeFlow === null || $freeFlow <= 0) return 'normal';
        $ratio = $current / $freeFlow; // 1 = livre, →0 = parado
        if ($ratio >= 0.85) return 'normal';
        if ($ratio >= 0.65) return 'moderate';
        if ($ratio >= 0.45) return 'slow';
        if ($ratio >= 0.25) return 'intense';
        return 'critical';
    }

    /** Monta um TrafficFlowSegment normalizado. $geometry = GeoJSON LineString array|null. */
    public static function flowSegment(array $in): array {
        $current  = isset($in['currentSpeedKmh']) ? (float)$in['currentSpeedKmh'] : null;
        $freeFlow = isset($in['freeFlowSpeedKmh']) ? (float)$in['freeFlowSpeedKmh'] : null;
        $closed   = !empty($in['roadClosure']);
        return [
            'id'                        => (string)($in['id'] ?? ''),
            'roadName'                  => $in['roadName'] ?? null,
            'currentSpeedKmh'           => $current,
            'freeFlowSpeedKmh'          => $freeFlow,
            'currentTravelTimeSeconds'  => isset($in['currentTravelTimeSeconds']) ? (int)$in['currentTravelTimeSeconds'] : null,
            'freeFlowTravelTimeSeconds' => isset($in['freeFlowTravelTimeSeconds']) ? (int)$in['freeFlowTravelTimeSeconds'] : null,
            'confidence'                => isset($in['confidence']) ? (float)$in['confidence'] : null,
            'roadClosure'               => $closed,
            'congestionLevel'           => self::congestionLevel($current, $freeFlow, $closed),
            'lengthMeters'              => isset($in['lengthMeters']) ? (float)$in['lengthMeters'] : null,
            'geometry'                  => $in['geometry'] ?? null,
            'updatedAt'                 => $in['updatedAt'] ?? gmdate('c'),
        ];
    }

    /**
     * Status normalizado da ocorrência (independente do TIPO).
     *   - 'ended'  : possui endTime e ele já passou → encerrada.
     *   - 'active' : em andamento (padrão; o feed da TomTom serve incidentes vigentes).
     * NÃO confundir com o tipo 'closure' (interdição), que é uma ocorrência ATIVA.
     * Só marcamos 'ended' quando há sinal confiável (endTime no passado); nunca presumimos
     * encerramento por texto da descrição (pt-PT costuma dizer "Encerrado ao trânsito" para
     * interdições vigentes).
     */
    public static function incidentStatus(array $in): string {
        $end = $in['endTime'] ?? null;
        if ($end) {
            $ts = strtotime((string)$end);
            if ($ts !== false && $ts < time()) return 'ended';
        }
        return 'active';
    }

    /** Monta um TrafficIncident normalizado. */
    public static function incident(array $in): array {
        $t = $in['type'] ?? 'other';
        $type = in_array($t, ['accident','closure','roadworks','congestion','hazard','other'], true) ? $t : 'other';
        $s = $in['severity'] ?? 'low';
        $sev = in_array($s, ['low','moderate','high','critical'], true) ? $s : 'low';
        return [
            'id'           => (string)($in['id'] ?? ''),
            'type'         => $type,
            'status'       => self::incidentStatus($in),
            'title'        => (string)($in['title'] ?? ''),
            'description'  => $in['description'] ?? null,
            'roadName'     => $in['roadName'] ?? null,
            'from'         => $in['from'] ?? null,
            'to'           => $in['to'] ?? null,
            'direction'    => $in['direction'] ?? null,
            'severity'     => $sev,
            'delaySeconds' => isset($in['delaySeconds']) ? (int)$in['delaySeconds'] : null,
            'lengthMeters' => isset($in['lengthMeters']) ? (float)$in['lengthMeters'] : null,
            'startTime'    => $in['startTime'] ?? null,
            'endTime'      => $in['endTime'] ?? null,
            'geometry'     => $in['geometry'] ?? null,
            'updatedAt'    => $in['updatedAt'] ?? gmdate('c'),
        ];
    }
}
}
