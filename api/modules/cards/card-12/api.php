<?php
// Card 12 - Cache Hit Rate (Redis)
// @version 4.5.0-P06-ENTERPRISE
// @changelog v4.5.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';

$CACHE_KEY = 'card:12:cache-rate:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

try {
    $redis = RedisHelper::getInstance();
    
    if (!$redis) {
        $output = ApiResponse::buildSuccess([
            'hit_rate' => 0,
            'hits' => 0,
            'misses' => 0,
            'redis_available' => false,
            'title' => 'Cache Hit Rate'
        ], ['version' => '4.5.0-P06-ENTERPRISE', 'cache' => 'miss', 'error' => 'Redis indisponivel']);
        
        header('Content-Type: application/json; charset=utf-8');
        echo $output;
        exit;
    }
    
    $info = $redis->info('stats');
    $hits = (int)($info['keyspace_hits'] ?? 0);
    $misses = (int)($info['keyspace_misses'] ?? 0);
    $total = $hits + $misses;
    $hitRate = $total > 0 ? round(($hits / $total) * 100, 1) : 0;
    
    $output = ApiResponse::buildSuccess([
        'hit_rate' => $hitRate,
        'hits' => $hits,
        'misses' => $misses,
        'redis_available' => true,
        'title' => 'Cache Hit Rate'
    ], ['version' => '4.5.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
