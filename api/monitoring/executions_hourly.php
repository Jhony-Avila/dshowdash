<?php
// Monitoring - Executions Hourly
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:executions-hourly';
$CACHE_TTL = RedisConfig::TTL_METRICS;

require_once '/var/www/dshowdash/config/db_connection.php';

// MIG-001 INTEGRACAO · 2º consumidor (27/11, VINHO): com a flag GLOBAL `obs_monitoramento`, as execuções por hora saem do REGISTRO CENTRAL
// (OBS-001), no mesmo formato; senão, o legado de sempre. Cache separado por fonte; registro fora = 503 (nunca zero).
require_once __DIR__ . '/../obs/ObsConsumidor.php';
$fonteObs = ObsConsumidor::ligado();   // flag única, decisão 60 s no cache (revisão do VERDE); erro = legado
if ($fonteObs) $CACHE_KEY = 'obs:' . $CACHE_KEY;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

if ($fonteObs) {
    try {
        $hourly = (new ObsExecucoes(getConnection('DSHOWDASH')))->porHora24h(new DateTimeImmutable('now'));
        RedisHelper::cacheAndReturn($CACHE_KEY, ApiResponse::buildSuccess(['hourly' => $hourly, 'period' => '24h'], ['version' => '2.3.0-P06-ENTERPRISE', 'fonte' => 'registro_execucoes']), $CACHE_TTL);
    } catch (Throwable $e) {
        RedisHelper::close();
        error_log('[monitoring] executions-hourly (registro): ' . get_class($e));
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['fonte' => 'registro_execucoes', 'estado' => 'indisponivel']);
    }
    exit;
}

try {
    $conn = getConnection('INTEGRACAO');
    $hourly = $conn->query("SELECT HOUR(execution_start) as hour, COUNT(*) as total, SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success, SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as errors, AVG(execution_time_seconds) as avg_time FROM sync_jobs_history WHERE execution_start >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY HOUR(execution_start) ORDER BY hour")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['hourly' => $hourly, 'period' => '24h'], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
