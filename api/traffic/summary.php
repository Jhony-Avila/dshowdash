<?php
/**
 * GET /api/traffic/summary.php — resumo LEVE para o indicador do header.
 * @version 1.0.0
 */
require __DIR__ . '/_bootstrap.php';

try {
    $r = TrafficService::getPayload($TRAFFIC_CFG, $TRAFFIC_PROVIDER);
    $s = $r['payload']['summary']; $m = $r['meta'];

    if (!headers_sent()) {
        header('X-Cache: ' . (($m['cache']['hit'] ?? false) ? 'HIT' : 'MISS'));
    }

    ApiResponse::success([
        'trafficIndex'          => $s['trafficIndex'],
        'level'                 => $s['level'],
        'estimatedCongestionKm' => $s['estimatedCongestionKm'],
        'congestedSegmentCount' => $s['congestedSegmentCount'] ?? null,
        'activeIncidents'       => $s['activeIncidents'],
        'endedIncidents'        => $s['endedIncidents'] ?? 0,
        'closures'              => $s['closures'],
        'accidents'             => $s['accidents'],
        'roadworks'             => $s['roadworks'],
        'congestion'            => $s['congestion'] ?? 0,
        'hazard'                => $s['hazard'] ?? 0,
        'other'                 => $s['other'] ?? 0,
        'comparisonPercentage'  => $s['comparisonPercentage'],
        'trend'                 => $s['trend'],
        'updatedAt'             => $s['updatedAt'],
        'stale'                 => $m['stale'] ?? false,
        'provider'              => $m['provider'],
    ]);
} catch (\Throwable $e) {
    error_log('[traffic:summary] ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, ['message' => 'traffic_unavailable']);
}
