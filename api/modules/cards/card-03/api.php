<?php
// Card 03 - Performance Score
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';
// SEC-002 lote S2 (27/11): portão de sessão antes do cache e do banco — 401 sem sessão; interno = CLI/loopback.
require_once __DIR__ . '/../../../core/AcessoSessao.php';
AcessoSessao::exigir();

$CACHE_KEY = 'card:03:performance:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

// MIG-001 lote 2 (27/11, VINHO): com a flag global obs_monitoramento, o número sai do REGISTRO CENTRAL (OBS-001) no MESMO formato
// (cache próprio; registro fora = 503; sem base = null, nunca 0); sem a flag, o legado da INTEGRACAO abaixo, como sempre.
require_once __DIR__ . '/../../../obs/ObsConsumidor.php';
if (ObsConsumidor::ligado()) ObsConsumidor::responder($CACHE_KEY, (int) $CACHE_TTL, '4.4.0-P06-ENTERPRISE', fn(ObsExecucoes $o) => (fn($m) => $m['media_taxa'] === null ? ['score' => null, 'success_rate' => null, 'avg_time' => null, 'title' => 'Performance Score'] : (fn($r, $tm) => ['score' => min(100, max(0, round($r - ($tm > 60 ? ($tm - 60) * 0.5 : 0)))), 'success_rate' => $r, 'avg_time' => $tm === null ? null : round($tm, 2), 'title' => 'Performance Score'])(round($m['media_taxa'], 1), $m['media_tempo']))($o->metricasCards(new DateTimeImmutable('now'))));

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT AVG(success_rate) as avg_rate, AVG(avg_execution_time) as avg_time
        FROM sync_jobs WHERE is_active = 1 AND is_deleted = 0
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $avgRate = round((float)($data['avg_rate'] ?? 0), 1);
    $avgTime = round((float)($data['avg_time'] ?? 0), 2);
    $score = min(100, max(0, round($avgRate - ($avgTime > 60 ? ($avgTime - 60) * 0.5 : 0))));
    
    $output = ApiResponse::buildSuccess([
        'score' => $score,
        'success_rate' => $avgRate,
        'avg_time' => $avgTime,
        'title' => 'Performance Score'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
