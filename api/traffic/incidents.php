<?php
/**
 * GET /api/traffic/incidents.php[?type=accident|closure|roadworks|congestion|hazard|other]
 * @version 1.0.0
 */
require __DIR__ . '/_bootstrap.php';

try {
    $r = TrafficService::getPayload($TRAFFIC_CFG, $TRAFFIC_PROVIDER);
    $incidents = $r['payload']['incidents']; $m = $r['meta'];

    $type = isset($_GET['type']) ? preg_replace('/[^a-z]/', '', strtolower((string)$_GET['type'])) : '';
    $allowed = ['accident','closure','roadworks','congestion','hazard','other'];
    if ($type !== '' && in_array($type, $allowed, true)) {
        $incidents = array_values(array_filter($incidents, fn($i) => $i['type'] === $type));
    }

    // Contagens do conjunto COMPLETO (payload._counts); fallback: conta o que veio.
    $counts = $r['payload']['_counts'] ?? null;
    if (!is_array($counts)) {
        $counts = ['accident'=>0,'closure'=>0,'roadworks'=>0,'congestion'=>0,'hazard'=>0,'other'=>0];
        foreach ($r['payload']['incidents'] as $i) { $counts[$i['type']] = ($counts[$i['type']] ?? 0) + 1; }
    }

    if (!headers_sent()) {
        header('X-Cache: ' . (($m['cache']['hit'] ?? false) ? 'HIT' : 'MISS'));
    }

    ApiResponse::success([
        'incidents' => $incidents,
        'counts'    => $counts,
        'total'     => count($incidents),
        'stale'     => $m['stale'] ?? false,
    ]);
} catch (\Throwable $e) {
    error_log('[traffic:incidents] ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 502, ['message' => 'traffic_unavailable']);
}
