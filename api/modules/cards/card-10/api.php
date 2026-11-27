<?php
// Card 10 - Performance Score Global
// @version 4.4.0-P06-ENTERPRISE
// @changelog v4.4.0-P06: Migrado para ApiResponse

require_once __DIR__ . '/../_init.php';
// SEC-002 lote S2 (27/11): portão de sessão antes do cache e do banco — 401 sem sessão; interno = CLI/loopback.
require_once __DIR__ . '/../../../core/AcessoSessao.php';
AcessoSessao::exigir();

$CACHE_KEY = 'card:10:performance-global:' . date('Y-m-d-H');
$CACHE_TTL = RedisConfig::TTL_MODULES;

// MIG-001 lote 2 (27/11, VINHO): com a flag global obs_monitoramento, o número sai do REGISTRO CENTRAL (OBS-001) no MESMO formato
// (cache próprio; registro fora = 503; sem base = null, nunca 0); sem a flag, o legado da INTEGRACAO abaixo, como sempre.
require_once __DIR__ . '/../../../obs/ObsConsumidor.php';
if (ObsConsumidor::ligado()) ObsConsumidor::responder($CACHE_KEY, (int) $CACHE_TTL, '4.4.0-P06-ENTERPRISE', fn(ObsExecucoes $o) => (fn($m) => $m['media_taxa'] === null ? ['value' => null, 'performance_score' => null, 'success_rate' => null, 'avg_time' => null, 'total_jobs' => $m['jobs'], 'title' => 'Performance Global'] : (fn($r, $tm) => (fn($sc) => ['value' => $sc, 'performance_score' => $sc, 'success_rate' => round($r, 1), 'avg_time' => $tm === null ? null : round($tm, 2), 'total_jobs' => $m['jobs'], 'title' => 'Performance Global'])(max(0, min(100, round($r - (($tm ?? 0) > 30 ? min(20, ($tm - 30) * 0.4) : 0))))))($m['media_taxa'], $m['media_tempo']))($o->metricasCards(new DateTimeImmutable('now'))));

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }
require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $stmt = $conn->query("
        SELECT 
            AVG(success_rate) as avg_rate,
            AVG(avg_execution_time) as avg_time,
            COUNT(*) as total_jobs
        FROM sync_jobs WHERE is_active = 1 AND is_deleted = 0
    ");
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // MIG-001 (27/11, VINHO): sem job ativo o AVG vem NULL — antes virava score 0 ("Performance 0%"), um zero falso. Agora null ("--").
    $semBase = !isset($data['avg_rate']);
    $avgRate = (float)($data['avg_rate'] ?? 0);
    $avgTime = (float)($data['avg_time'] ?? 0);
    $timePenalty = $avgTime > 30 ? min(20, ($avgTime - 30) * 0.4) : 0;
    $score = $semBase ? null : max(0, min(100, round($avgRate - $timePenalty)));
    
    $output = ApiResponse::buildSuccess([
        'value' => $score,   // MIG-001 INTEGRACAO (27/11, VINHO): a tela lê `value` (formatters.js); a API não mandava → o card mostrava sempre 0/--. Agora `value` = o número real ou null.
        'performance_score' => $score,
        'success_rate' => $semBase ? null : round($avgRate, 1),
        'avg_time' => isset($data['avg_time']) ? round($avgTime, 2) : null,
        'total_jobs' => (int)($data['total_jobs'] ?? 0),
        'title' => 'Performance Global'
    ], ['version' => '4.4.0-P06-ENTERPRISE', 'cache' => 'miss']);
    
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    error_log(basename(dirname(__FILE__)) . ' error: ' . $e->getMessage());
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
