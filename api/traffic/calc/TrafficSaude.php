<?php
/**
 * TrafficSaude — regras PURAS de saúde e qualidade do Trânsito (23/11/2026; achado da CIMA: TomTom vazia e health "up").
 * Sem Redis e sem rede: testável em api/traffic/tests/teste-saude.php.
 *  - "up"      : o provedor devolveu FLUXO DE VERDADE e o último retrato está completo (todas as vias + ocorrências).
 *  - "parcial" : o provedor responde, mas o último retrato veio incompleto ou vazio (vias faltando, ocorrências indisponíveis, sem retrato).
 *  - "down"    : o provedor não devolve fluxo (cota, chave, 5xx, sem resposta) — motivo em classe, sem detalhe do provedor.
 */
if (!class_exists('TrafficSaude')) {
final class TrafficSaude {
    public const CAMPOS_OCORRENCIAS = ['activeIncidents', 'endedIncidents', 'closures', 'accidents', 'roadworks', 'congestion', 'hazard', 'other'];

    /** qualidade do retrato montado nesta leitura */
    public static function qualidade(bool $flowOk, bool $incOk, int $flowLidas, ?array $diag): array {
        $esperado = is_array($diag) ? (int) ($diag['flow_esperado'] ?? 0) : 0;
        $completo = $flowOk && $incOk && ($esperado === 0 || $flowLidas >= $esperado);
        return [
            'status' => $completo ? 'complete' : 'partial',
            'flowAvailable' => $flowOk && $flowLidas > 0,
            'incidentsAvailable' => $incOk,
            'congestionDistanceAvailable' => $flowOk && $flowLidas > 0,
            'flowSegments' => $flowLidas,
            'flowExpected' => $esperado,
            'errors' => is_array($diag) ? array_keys($diag['erros'] ?? []) : [],
        ];
    }

    /** ocorrências indisponíveis → contagens NULAS (sem dado), nunca zero */
    public static function anularOcorrencias(array $summary): array {
        foreach (self::CAMPOS_OCORRENCIAS as $k) { $summary[$k] = null; }
        return $summary;
    }

    /**
     * @param array      $providerHealth ['status' => 'up'|'down', 'detail' => classe]
     * @param array|null $quality        `_quality` do último retrato (cache quente ou velho); null = nenhum retrato
     * @return array{status:string, motivo:?string}
     */
    public static function avaliar(array $providerHealth, ?array $quality, bool $retratoVelho = false): array {
        if (($providerHealth['status'] ?? 'down') !== 'up') {
            return ['status' => 'down', 'motivo' => (string) ($providerHealth['detail'] ?? 'sem_resposta')];
        }
        if ($quality === null) { return ['status' => 'parcial', 'motivo' => 'sem_retrato_recente']; }
        $m = [];
        if ($retratoVelho) { $m[] = 'retrato_velho'; }
        if (!($quality['flowAvailable'] ?? false)) { $m[] = 'fluxo_vazio'; }
        elseif (isset($quality['flowExpected'], $quality['flowSegments']) && (int) $quality['flowExpected'] > 0 && (int) $quality['flowSegments'] < (int) $quality['flowExpected']) {
            $m[] = 'fluxo_parcial_' . (int) $quality['flowSegments'] . '_de_' . (int) $quality['flowExpected'];
        }
        if (!($quality['incidentsAvailable'] ?? false)) { $m[] = 'ocorrencias_indisponiveis'; }
        if ($m === [] && ($quality['status'] ?? '') !== 'complete') { $m[] = 'retrato_incompleto'; }
        return $m === [] ? ['status' => 'up', 'motivo' => null] : ['status' => 'parcial', 'motivo' => implode(',', $m)];
    }
}
}
