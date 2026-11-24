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

    // Saúde do FLUXO (achado da CIMA 23/11): "up" só com fluxo de verdade e retrato completo; "parcial" com retrato vazio/incompleto
    require_once __DIR__ . '/calc/TrafficSaude.php';
    $quente = RedisHelper::tryGetCache($prefix . 'payload:v1');
    $velho = $quente === null ? RedisHelper::tryGetCache($prefix . 'payload:stale:v1') : null;
    $ultimo = json_decode((string) ($quente ?? $velho ?? ''), true);
    $qualidade = is_array($ultimo) ? ($ultimo['_quality'] ?? null) : null;
    $saude = TrafficSaude::avaliar(is_array($health) ? $health : [], is_array($qualidade) ? $qualidade : null, $quente === null && $velho !== null);
    ApiResponse::success([
        'status'      => $saude['status'],      // up | parcial | down
        'motivo'      => $saude['motivo'],
        'qualidade'   => $qualidade,
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
