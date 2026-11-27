<?php
// Monitoring - Get Cron Jobs Minimal
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$CACHE_KEY = 'monitoring:cron-jobs-minimal';
$CACHE_TTL = RedisConfig::TTL_MODULES;

// MIG-001 lote 3 (27/11, VINHO): com a flag global obs_monitoramento, a resposta sai do REGISTRO CENTRAL (OBS-001) no MESMO formato
// (cache próprio; registro fora = 503; o que depende do catálogo — cron, tipo — fica vazio com total null); sem a flag, o legado abaixo.
require_once __DIR__ . '/../obs/ObsConsumidor.php';
if (ObsConsumidor::ligado()) ObsConsumidor::responder($CACHE_KEY, (int) $CACHE_TTL, '2.3.0-P06-ENTERPRISE', fn(ObsExecucoes $o) => ObsExecucoes::monitoringLegado('cron-jobs-minimal', $o->comoSyncJobs()));

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

require_once '/var/www/dshowdash/config/db_connection.php';

try {
    $conn = getConnection('INTEGRACAO');
    $jobs = $conn->query("SELECT id, job_name, is_active, is_running, success_rate FROM sync_jobs WHERE is_deleted = 0 ORDER BY job_name")->fetchAll(PDO::FETCH_ASSOC);
    $output = ApiResponse::buildSuccess(['jobs' => $jobs, 'total' => count($jobs)], ['version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);
} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
