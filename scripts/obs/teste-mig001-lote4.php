<?php
declare(strict_types=1);
// teste-mig001-lote4.php — MIG-001 lote 4 (VINHO, 27/11): get_cron_frequencies, get_jobs_by_category, metrics (monitoring) e health/heatmap sobre o registro central. MySQL LOCAL, banco temporário zz_lote4.
// Prova: (1) os números do registro (contagensDoDia) por dia civil de Brasília; (2) cada card monta o MESMO formato do legado (chaves iguais, `value`
// incluso) e a tela REAL (formatters.js) mostra o número; média sem base = null ("--"); (3) a troca só pela flag; registro fora = 503.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote4_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');   // 12:00 em Brasília
$v = ObsExecucoes::monitoringLegado2('metrics', $o->comoSyncJobs(), $o->janelaHoras($agora, 24), $o->janelaHoras($agora, 1));
$ck('registro vazio: métricas com contagens 0 de verdade, médias null, taxa 24 h null (antes: 0); categorias vazias; frequências vazias com total null; mapa vazio',
    $v['jobs']['total'] === 0 && $v['jobs']['avg_success_rate'] === null && $v['executions_24h'] === ['total' => 0, 'success' => 0, 'errors' => 0, 'avg_time' => null] && $v['success_rate_24h'] === null
    && ObsExecucoes::monitoringLegado2('jobs-by-category', []) === ['categories' => [], 'total_categories' => 0] && ObsExecucoes::monitoringLegado2('cron-frequencies', []) === ['frequencies' => [], 'total' => null]
    && $o->mapaDeCalor($agora, 7) === [], json_encode($v));
foreach ([['asaas.sincronizar', 'zenthra', '2026-11-27 13:37:00', 60, 'ok', null], ['asaas.sincronizar', 'rovic', '2026-11-27 14:37:00', 90, 'ok', null],
          ['rd.sincronizar', '-', '2026-11-27 14:41:00', 5, 'falhou', 'fonte'], ['bling.pedidos', '-', '2026-11-26 13:00:00', 30, 'falhou', 'tempo']] as [$j, $e, $ini, $dur, $est, $err]) {
    $o->iniciar($j, $e, $T($ini), 1, 3600, $T($ini)); $o->encerrar($j, $e, $T($ini), 1, $est, $est === 'ok' ? 1 : null, $err, $T($ini)->modify("+$dur seconds"));
}
$o->iniciar('pipedrive.sync', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$sj = $o->comoSyncJobs(); $m = ObsExecucoes::monitoringLegado2('metrics', $sj, $o->janelaHoras($agora, 24), $o->janelaHoras($agora, 1));
$ck('metrics: formato legado (jobs, executions_24h, executions_1h, success_rate_24h) e valores (24 h: 4 = 2 ok, 1 erro, a por tempo fora; 1 h: 3; taxa 50%)',
    array_keys($m) === ['jobs', 'executions_24h', 'executions_1h', 'success_rate_24h'] && array_keys($m['jobs']) === ['total', 'active', 'running', 'with_errors', 'avg_success_rate']
    && array_keys($m['executions_24h']) === ['total', 'success', 'errors', 'avg_time'] && array_keys($m['executions_1h']) === ['total', 'success', 'errors']
    && $m['executions_24h']['total'] === 4 && $m['executions_24h']['success'] === 2 && $m['executions_24h']['errors'] === 1 && $m['executions_1h']['total'] === 3
    && $m['success_rate_24h'] === 50.0 && $m['jobs']['total'] === 5 && $m['jobs']['running'] === 1, json_encode($m));
$cat = ObsExecucoes::monitoringLegado2('jobs-by-category', $sj);
$ck('jobs-by-category: uma categoria só, null (o registro não tem tipo), com os totais; chaves do legado', $cat['total_categories'] === 1 && $cat['categories'][0]['category'] === null
    && array_keys($cat['categories'][0]) === ['category', 'total', 'active', 'running', 'avg_success_rate'] && $cat['categories'][0]['total'] === 5);
$mc = $o->mapaDeCalor($agora, 7);
$ck('heatmap: por dia e hora de Brasília (ontem 10h: 1 com erro por tempo = 0 erros; hoje 10h: 1 ok; hoje 11h: 1 ok + 1 erro + 1 rodando); chaves do legado',
    array_keys($mc[0]) === ['date', 'hour', 'total', 'success', 'errors', 'success_rate'] && count($mc) === 3 && $mc[0]['date'] === '2026-11-26' && $mc[0]['errors'] === 0
    && $mc[2]['hour'] === 11 && $mc[2]['total'] === 3 && $mc[2]['success'] === 1 && $mc[2]['errors'] === 1 && $mc[2]['success_rate'] === 33.33, json_encode($mc));
foreach (['api/monitoring/get_cron_frequencies.php', 'api/monitoring/get_jobs_by_category.php', 'api/monitoring/metrics.php', 'api/health/heatmap.php'] as $arq) {
    $src = (string) file_get_contents("$RAIZ/$arq");
    $ck("$arq: troca antes do cache legado, só pela flag única; legado intacto abaixo", strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')")); }
echo "teste-mig001-lote4: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
