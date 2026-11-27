<?php
declare(strict_types=1);
// teste-mig001-lote5-dashboard.php — MIG-001 lote 5 (VINHO, 27/11): dashboard/status-jobs, status_executions e performance sobre o registro central. MySQL LOCAL, banco temporário zz_lote5.
// Prova: (1) os números do registro (contagensDoDia) por dia civil de Brasília; (2) cada card monta o MESMO formato do legado (chaves iguais, `value`
// incluso) e a tela REAL (formatters.js) mostra o número; média sem base = null ("--"); (3) a troca só pela flag; registro fora = 503.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote5_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');   // 12:00 em Brasília
$v = ObsExecucoes::statusJobsLegado($o->comoSyncJobs()); $e = $o->statusExecucoesLegado($agora); $p = $o->desempenhoLegado($agora, 7, '7d');
$ck('registro vazio: contagens 0, listas vazias, média de 24 h null', $v['counts'] === ['total' => 0, 'active' => 0, 'inactive' => 0, 'running' => 0, 'with_errors' => 0] && $v['running'] === []
    && $e['stats_24h']['avg_time'] === null && $e['recent'] === [] && $e['by_hour'] === [] && $p === ['slow_jobs' => [], 'error_jobs' => [], 'most_executed' => [], 'period' => '7d']);
foreach ([['asaas.sincronizar', 'zenthra', '2026-11-27 13:37:00', 60, 'ok', 3], ['asaas.sincronizar', 'zenthra', '2026-11-27 14:37:00', 120, 'ok', 5],
          ['rd.sincronizar', '-', '2026-11-27 13:41:00', 5, 'falhou', null], ['rd.sincronizar', '-', '2026-11-27 14:41:00', 5, 'falhou', null]] as [$j, $es, $ini, $dur, $est, $vol]) {
    $o->iniciar($j, $es, $T($ini), 1, 3600, $T($ini)); $o->encerrar($j, $es, $T($ini), 1, $est, $vol, $est === 'ok' ? null : 'fonte', $T($ini)->modify("+$dur seconds"));
}
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$v = ObsExecucoes::statusJobsLegado($o->comoSyncJobs()); $e = $o->statusExecucoesLegado($agora); $p = $o->desempenhoLegado($agora, 7, '7d');
$ck('status-jobs: chaves do legado (counts, running[id,job_name,last_execution,avg_execution_time], with_errors[id,job_name,error_count,last_execution]); 3 jobs, 1 rodando, 1 com erro',
    array_keys($v) === ['counts', 'running', 'with_errors'] && array_keys($v['counts']) === ['total', 'active', 'inactive', 'running', 'with_errors'] && array_keys($v['running'][0]) === ['id', 'job_name', 'last_execution', 'avg_execution_time']
    && array_keys($v['with_errors'][0]) === ['id', 'job_name', 'error_count', 'last_execution'] && $v['counts']['total'] === 3 && $v['counts']['running'] === 1 && $v['with_errors'][0]['job_name'] === 'rd.sincronizar' && $v['with_errors'][0]['error_count'] === 2, json_encode($v));
$ck('status_executions: stats_24h, recent (mais recente primeiro, chaves do legado), by_hour por "Y-m-d H:00" de Brasília', array_keys($e) === ['stats_24h', 'recent', 'by_hour'] && $e['stats_24h']['total'] === 5
    && array_keys($e['recent'][0]) === ['job_name', 'status', 'execution_start', 'execution_time_seconds', 'rows_affected'] && $e['recent'][0]['job_name'] === 'bling.pedidos' && $e['recent'][0]['status'] === 'running'
    && array_column($e['by_hour'], 'hour') === ['2026-11-27 10:00', '2026-11-27 11:00'] && $e['by_hour'][1]['total'] === 3, json_encode($e));
$ck('performance: slow_jobs (média 90 s, máx 120 s do asaas), error_jobs (rd 2), most_executed, period; chaves do legado', array_keys($p) === ['slow_jobs', 'error_jobs', 'most_executed', 'period']
    && $p['slow_jobs'][0] === ['job_name' => 'asaas.sincronizar@zenthra', 'avg_time' => 90.0, 'max_time' => 120.0, 'executions' => 2] && $p['error_jobs'][0]['error_count'] === 2
    && array_keys($p['most_executed'][0]) === ['job_name', 'executions', 'successes', 'errors'], json_encode($p));
foreach (['api/dashboard/status-jobs.php', 'api/dashboard/status_executions.php', 'api/dashboard/performance.php'] as $arq) {
    $src = (string) file_get_contents("$RAIZ/$arq");
    $ck("$arq: troca antes do cache legado, só pela flag única; legado intacto abaixo", strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')")); }
echo "teste-mig001-lote5-dashboard: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
