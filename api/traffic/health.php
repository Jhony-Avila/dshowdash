<?php
/**
 * GET /api/traffic/health.php — status do provedor e do cache.
 * @version 1.0.0
 */
require __DIR__ . '/_bootstrap.php';

try {
    $prefix = $TRAFFIC_CFG['cache']['key_prefix'];
    $hasCache = RedisHelper::tryGetCache($prefix . 'payload:v1') !== null;

    // Health do provider é cacheado à parte (evita bater a API externa a cada health).
    $hKey = $prefix . 'health:v1';
    $cachedHealth = RedisHelper::tryGetCache($hKey);
    if ($cachedHealth !== null) {
        $health = json_decode($cachedHealth, true);
    } else {
        $health = $TRAFFIC_PROVIDER->health();
        RedisHelper::setCache($hKey, json_encode($health), (int)$TRAFFIC_CFG['cache']['ttl_health']);
    }

    ApiResponse::success([
        'provider'    => $TRAFFIC_PROVIDER->name(),
        'providerHealth' => $health,
        'cacheWarm'   => $hasCache,
        'city'        => $TRAFFIC_CFG['city'],
        'checkedAt'   => gmdate('c'),
    ]);
} catch (\Throwable $e) {
    error_log('[traffic:health] ' . $e->getMessage());
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'health_failed']);
}
