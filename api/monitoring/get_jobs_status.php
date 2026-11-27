<?php
// Monitoring - Get Jobs Status Enterprise
// @version 2.3.0-P06-ENTERPRISE

require_once __DIR__ . '/_init.php';
require_once __DIR__ . '/../core/helpers/RedisHelper.php';

$is_active = $_GET['is_active'] ?? '1';
$job_type = $_GET['job_type'] ?? '';
$search = $_GET['search'] ?? '';
$limit = min((int)($_GET['limit'] ?? 100), 1000);

$cache_active = $is_active !== '' ? $is_active : 'all';
$cache_type = $job_type ?: 'all';
$cache_search = $search ? md5($search) : 'none';
$CACHE_KEY = "monitoring:jobs-status:{$cache_active}:{$cache_type}:{$cache_search}:{$limit}";
$CACHE_TTL = RedisConfig::TTL_MODULES;

require_once '/var/www/dshowdash/config/db_connection.php';

// MIG-001 INTEGRACAO · piloto (27/11, VINHO): com a flag GLOBAL `obs_monitoramento` ligada, a lista sai do REGISTRO CENTRAL de execuções
// (DSHOWDASH.obs_execucao, OBS-001) no MESMO formato, em vez do banco legado INTEGRACAO (que ninguém no repo alimenta). Flag ausente,
// desligada ou ilegível = o caminho legado de sempre. Cache separado por fonte.
require_once __DIR__ . '/../obs/ObsConsumidor.php';
$fonteObs = ObsConsumidor::ligado();   // flag única, decisão 60 s no cache (revisão do VERDE); erro = legado
if ($fonteObs) $CACHE_KEY = 'obs:' . $CACHE_KEY;

if (RedisHelper::serveIfCached($CACHE_KEY)) { exit; }

if ($fonteObs) {
    try {
        require_once __DIR__ . '/../obs/ObsExecucoes.php';
        $data = ObsExecucoes::jobsStatusLegado((new ObsExecucoes(getConnection('DSHOWDASH')))->comoSyncJobs(), (string) $is_active, (string) $job_type, (string) $search, $limit);
        RedisHelper::cacheAndReturn($CACHE_KEY, ApiResponse::buildSuccess($data, ['rows_affected' => count($data['jobs']), 'version' => '2.3.0-P06-ENTERPRISE', 'fonte' => 'registro_execucoes']), $CACHE_TTL);
    } catch (Throwable $e) {
        RedisHelper::close();
        error_log('[monitoring] jobs-status (registro): ' . get_class($e));
        ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 503, ['fonte' => 'registro_execucoes', 'estado' => 'indisponivel']);
    }
    exit;
}

try {
    $conn = getConnection('INTEGRACAO');

    $where = ["is_deleted = 0"];
    $params = [];

    if ($is_active !== '') {
        $where[] = "is_active = :is_active";
        $params[':is_active'] = (int)$is_active;
    }
    if ($job_type) {
        $where[] = "job_type = :job_type";
        $params[':job_type'] = $job_type;
    }
    if ($search) {
        $where[] = "(job_name LIKE :search1 OR description LIKE :search2)";
        $params[':search1'] = '%' . $search . '%';
        $params[':search2'] = '%' . $search . '%';
    }

    $sql = "SELECT id, job_name, job_type, description, is_active, is_running, error_count, last_execution, last_success, success_rate, avg_execution_time, total_executions, created_at, updated_at FROM sync_jobs WHERE " . implode(' AND ', $where) . " ORDER BY last_execution DESC LIMIT {$limit}";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $jobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stats = $conn->query("SELECT COUNT(*) as total_jobs, SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_jobs, SUM(CASE WHEN error_count > 0 THEN 1 ELSE 0 END) as jobs_with_errors, AVG(success_rate) as avg_success_rate FROM sync_jobs WHERE is_deleted = 0")->fetch(PDO::FETCH_ASSOC);

    $filters = ['is_active' => $is_active, 'job_type' => $job_type, 'search' => $search, 'limit' => $limit];

    $data = ['jobs' => $jobs, 'statistics' => $stats, 'filters' => $filters, 'total' => count($jobs)];

    $output = ApiResponse::buildSuccess($data, ['rows_affected' => count($jobs), 'version' => '2.3.0-P06-ENTERPRISE']);
    RedisHelper::cacheAndReturn($CACHE_KEY, $output, $CACHE_TTL);

} catch (Exception $e) {
    RedisHelper::close();
    ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500);
}
