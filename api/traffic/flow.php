<?php
/**
 * GET /api/traffic/flow.php — segmentos de fluxo (para o mapa), como GeoJSON próprio.
 * @version 1.0.0
 */
require __DIR__ . '/_bootstrap.php';

try {
    $r = TrafficService::getPayload($TRAFFIC_CFG, $TRAFFIC_PROVIDER);
    $p = $r['payload']; $m = $r['meta'];

    if (!headers_sent()) {
        header('X-Cache: ' . (($m['cache']['hit'] ?? false) ? 'HIT' : 'MISS'));
    }

    ApiResponse::success([
        'flow'   => $p['flow'],
        'bounds' => $p['bounds'],
        'center' => $p['center'],
        'stale'  => $m['stale'] ?? false,
    ]);
} catch (\Throwable $e) {
    error_log('[traffic:flow] ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, ['message' => 'traffic_unavailable']);
}
