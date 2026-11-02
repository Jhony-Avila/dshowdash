<?php
/**
 * TrafficService - orquestra provider + cálculo + cache + fallback stale.
 * @version 1.0.0
 * @description Fonte única do "payload" de trânsito (summary + flow + incidents + metadata).
 *   Os endpoints (dashboard/summary/flow/incidents) apenas moldam a saída a partir daqui,
 *   compartilhando o MESMO cache Redis → nunca mais de uma chamada externa por janela.
 */

require_once __DIR__ . '/../core/helpers/RedisHelper.php';
require_once __DIR__ . '/calc/TrafficIndex.php';

if (!class_exists('TrafficService')) {
final class TrafficService {

    /**
     * Retorna ['payload' => [...], 'meta' => [...]].
     * payload = ['summary','flow','incidents','bounds','center'].
     * meta    = ['provider','cache'=>['hit','ageSeconds'],'stale','dataQuality',...].
     */
    public static function getPayload(array $cfg, TrafficProvider $provider): array {
        $prefix   = $cfg['cache']['key_prefix'];
        $dataKey  = $prefix . 'payload:v1';
        $staleKey = $prefix . 'payload:stale:v1';
        $tsKey    = $prefix . 'payload:ts:v1';
        $idxKey   = $prefix . 'lastindex:v1';

        // 1) Cache quente
        $cached = RedisHelper::tryGetCache($dataKey);
        if ($cached !== null) {
            $payload = json_decode($cached, true);
            if (is_array($payload)) {
                $ts = (int)(RedisHelper::tryGetCache($tsKey) ?? 0);
                return ['payload' => $payload, 'meta' => [
                    'provider'    => $provider->name(),
                    'cache'       => ['hit' => true, 'ageSeconds' => $ts > 0 ? max(0, time() - $ts) : null],
                    'stale'       => false,
                    'dataQuality' => $payload['_quality'] ?? self::qualityFrom($payload),
                ]];
            }
        }

        // 2) Buscar do provider (flow e incidents independentes → suporta resposta parcial)
        $bounds = $cfg['bounds'];
        $flow = []; $incidents = [];
        $flowOk = false; $incOk = false;
        try { $flow = $provider->getTrafficFlow($bounds); $flowOk = true; }
        catch (\Throwable $e) { error_log('[traffic:flow] ' . $e->getMessage()); }
        try { $incidents = $provider->getIncidents($bounds); $incOk = true; }
        catch (\Throwable $e) { error_log('[traffic:incidents] ' . $e->getMessage()); }

        // Falha TOTAL → tenta stale
        if (!$flowOk && !$incOk) {
            $stale = RedisHelper::tryGetCache($staleKey);
            if ($stale !== null) {
                $payload = json_decode($stale, true);
                if (is_array($payload)) {
                    return ['payload' => $payload, 'meta' => [
                        'provider' => $provider->name(),
                        'cache'    => ['hit' => false, 'ageSeconds' => null],
                        'stale'    => true,
                        'lastSuccessfulUpdate' => $payload['summary']['updatedAt'] ?? null,
                        'dataQuality' => ['status' => 'stale', 'flowAvailable' => false, 'incidentsAvailable' => false, 'congestionDistanceAvailable' => false],
                    ]];
                }
            }
            throw new RuntimeException('provider_unavailable');
        }

        // 3) Calcular summary
        $prevIndex = RedisHelper::tryGetCache($idxKey);
        $prevIndex = ($prevIndex === null || $prevIndex === '') ? null : (float)$prevIndex;
        // Summary calculado do conjunto COMPLETO (contagens precisas).
        $summary = TrafficIndex::computeSummary($flow, $incidents, $cfg, $prevIndex);

        // Contagens por tipo do conjunto completo (p/ o endpoint incidents).
        $counts = ['accident'=>0,'closure'=>0,'roadworks'=>0,'congestion'=>0,'hazard'=>0,'other'=>0];
        foreach ($incidents as $i) { $counts[$i['type']] = ($counts[$i['type']] ?? 0) + 1; }

        // Payload envia só as N ocorrências mais severas (mapa/lista); contagens vêm do total acima.
        $maxInc = (int)($cfg['display']['max_incidents'] ?? 300);
        if (count($incidents) > $maxInc) {
            $sevW = ['critical'=>0,'high'=>1,'moderate'=>2,'low'=>3];
            usort($incidents, fn($a,$b) => ($sevW[$a['severity']] ?? 4) <=> ($sevW[$b['severity']] ?? 4));
            $incidents = array_slice($incidents, 0, $maxInc);
        }

        $quality = [
            'status' => ($flowOk && $incOk) ? 'complete' : 'partial',
            'flowAvailable' => $flowOk && count($flow) > 0,
            'incidentsAvailable' => $incOk,
            'congestionDistanceAvailable' => $summary['estimatedCongestionKm'] !== null,
        ];

        $payload = [
            'summary'   => $summary,
            'flow'      => $flow,
            'incidents' => $incidents,
            'bounds'    => $bounds,
            'center'    => $cfg['center'],
            '_counts'   => $counts,
            '_quality'  => $quality,
        ];

        // 4) Gravar caches
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        RedisHelper::setCache($dataKey, $json, (int)$cfg['cache']['ttl_dashboard']);
        RedisHelper::setCache($staleKey, $json, (int)$cfg['cache']['ttl_stale']);
        RedisHelper::setCache($tsKey, (string)time(), (int)$cfg['cache']['ttl_stale']);
        if ($summary['trafficIndex'] !== null) {
            RedisHelper::setCache($idxKey, (string)$summary['trafficIndex'], (int)$cfg['cache']['ttl_stale']);
        }

        return ['payload' => $payload, 'meta' => [
            'provider'    => $provider->name(),
            'cache'       => ['hit' => false, 'ageSeconds' => 0],
            'stale'       => false,
            'dataQuality' => $quality,
        ]];
    }

    private static function qualityFrom(array $payload): array {
        return [
            'status' => 'complete',
            'flowAvailable' => !empty($payload['flow']),
            'incidentsAvailable' => isset($payload['incidents']),
            'congestionDistanceAvailable' => ($payload['summary']['estimatedCongestionKm'] ?? null) !== null,
        ];
    }
}
}
