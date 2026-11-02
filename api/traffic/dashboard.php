<?php
/**
 * GET /api/traffic/dashboard.php — payload completo do painel de trânsito de SP.
 * @version 1.0.0
 */
require __DIR__ . '/_bootstrap.php';

try {
    $r = TrafficService::getPayload($TRAFFIC_CFG, $TRAFFIC_PROVIDER);
    $p = $r['payload']; $m = $r['meta'];
    $now = time();

    if (!headers_sent()) {
        header('X-Cache: ' . (($m['cache']['hit'] ?? false) ? 'HIT' : 'MISS'));
    }

    $data = [
        'provider'    => $m['provider'],
        'generatedAt' => gmdate('c', $now),
        'expiresAt'   => gmdate('c', $now + (int)$TRAFFIC_CFG['cache']['ttl_dashboard']),
        'summary'     => $p['summary'],
        'flow'        => $p['flow'],
        'incidents'   => $p['incidents'],
        'metadata'    => [
            'city'        => $TRAFFIC_CFG['city'],
            'bounds'      => $p['bounds'],
            'center'      => $p['center'],
            'cache'       => $m['cache'],
            'stale'       => $m['stale'] ?? false,
            'dataQuality' => $m['dataQuality'],
        ],
    ];
    ApiResponse::success($data);
} catch (\Throwable $e) {
    error_log('[traffic:dashboard] ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, ['message' => 'traffic_unavailable']);
}
