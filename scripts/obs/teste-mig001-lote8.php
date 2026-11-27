<?php
declare(strict_types=1);
// teste-mig001-lote8.php — MIG-001 lote 8 (VINHO, 27/11): panels 07, 13, 18 e 19 sobre o registro central. MySQL LOCAL, banco descartável zz_lote8_*.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote8_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
// Prova: (1) registro vazio = contagens 0 de verdade e médias/taxas null (nunca 0 inventado); (2) chaves IGUAIS às do legado; (3) números certos
// Prova: (1) vazio = contagens 0 e médias/percentuais/status null; (2) chaves IGUAIS às do legado; (3) números por dia/hora de Brasília;
// (4) cada endpoint ALCANÇÁVEL (requires existem), troca só pela flag, depois do requireAuth e antes do cache.
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');   // 12:00 em Brasília
$r = $o->emExecucaoLegado($agora); $s = $o->slaLegado($agora, 30); $d = $o->taxaDiariaLegado($agora, 30);
$ck('vazio · 07: listas vazias, contagens 0', $r === ['running' => [], 'recent_completed' => [], 'statistics' => ['total_running' => 0, 'slow_jobs' => 0, 'normal_jobs' => 0]], json_encode($r));
$ck('vazio · 13/18: availability_percent e uptime_status null; chaves do legado', array_keys($s) === ['period', 'availability', 'jobs_sla', 'critical_jobs', 'summary']
    && $s['availability'] === ['total_executions' => 0, 'successful' => 0, 'failed' => 0, 'availability_percent' => null, 'uptime_status' => null] && $s['period'] === ['days' => 30, 'from' => '2026-10-28', 'to' => '2026-11-27'], json_encode($s));
$ck('vazio · 19: médias null, tendência null, destaques null', array_keys($d) === ['period', 'chart_data', 'summary', 'highlights', 'trend'] && $d['chart_data'] === []
    && $d['summary']['avg_success_rate'] === null && $d['summary']['avg_execution_time'] === null && $d['trend'] === ['recent_7d_avg' => null, 'previous_7d_avg' => null, 'change' => null, 'status' => null], json_encode($d));
// massa sintética: asaas 12 execuções (11 ok, 1 tempo) em 12 dias às 10:37 Brasília; rd 3 falhas nos últimos 3 dias; bling rodando há 50 min
for ($i = 11; $i >= 0; $i--) { $ini = $T('2026-11-27 13:37:00')->modify("-$i days"); $o->iniciar('asaas.sincronizar', 'zenthra', $ini, 1, 3600, $ini);
    $o->encerrar('asaas.sincronizar', 'zenthra', $ini, 1, $i === 3 ? 'falhou' : 'ok', $i === 3 ? null : 2, $i === 3 ? 'tempo' : null, $ini->modify('+60 seconds')); }
foreach ([2, 1, 0] as $i) { $ini = $T('2026-11-27 13:41:00')->modify("-$i days"); $o->iniciar('rd.sincronizar', '-', $ini, 1, 3600, $ini); $o->encerrar('rd.sincronizar', '-', $ini, 1, 'falhou', null, 'fonte', $ini->modify('+5 seconds')); }
$ini = $T('2026-11-27 14:56:00'); $o->iniciar('ml.pedidos', '-', $ini, 1, 3600, $ini); $o->encerrar('ml.pedidos', '-', $ini, 1, 'ok', 7, null, $T('2026-11-27 14:57:30'));
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:10:00'), 1, 7200, $T('2026-11-27 14:10:00'));
$r = $o->emExecucaoLegado($agora);
$ck('07: bling rodando há 3000 s, média desconhecida → status null (não "slow" por 0); chaves do legado', count($r['running']) === 1 && array_keys($r['running'][0]) === ['id', 'job_name', 'job_type', 'started_at', 'running_for_seconds', 'avg_execution_time', 'status']
    && $r['running'][0]['running_for_seconds'] === 3000 && $r['running'][0]['status'] === null && $r['statistics'] === ['total_running' => 1, 'slow_jobs' => 0, 'normal_jobs' => 1], json_encode($r['running']));
$ck('07: recent_completed = só as terminadas nos últimos 5 min (ml.pedidos), chaves do legado', count($r['recent_completed']) === 1 && $r['recent_completed'][0]['job_name'] === 'ml.pedidos'
    && array_keys($r['recent_completed'][0]) === ['job_name', 'status', 'started_at', 'finished_at', 'duration', 'rows_affected'] && $r['recent_completed'][0]['duration'] === 90.0 && $r['recent_completed'][0]['rows_affected'] === 7, json_encode($r['recent_completed']));
$s = $o->slaLegado($agora, 30);
$ck('13/18: availability 30 d = 17 execuções (a em andamento conta, como no histórico legado), 12 ok (11 asaas + ml), 3 erros (o "tempo" não é error), 70.588%, poor', $s['availability'] === ['total_executions' => 17, 'successful' => 12, 'failed' => 3, 'availability_percent' => 70.588, 'uptime_status' => 'poor'], json_encode($s['availability']));
$ck('13/18: jobs_sla só com > 10 execuções (asaas), taxa 91.67 → warning; chaves do legado', count($s['jobs_sla']) === 1 && $s['jobs_sla'][0]['job_name'] === 'asaas.sincronizar@zenthra' && $s['jobs_sla'][0]['status'] === 'warning'
    && $s['jobs_sla'][0]['recent_executions'] === 12 && array_keys($s['jobs_sla'][0]) === ['job_name', 'job_type', 'avg_execution_time', 'success_rate', 'total_executions', 'recent_executions', 'recent_success', 'recent_errors', 'recent_success_rate', 'status'], json_encode($s['jobs_sla']));
$ck('13/18: critical_jobs = rd (3 erros em 7 dias); summary', count($s['critical_jobs']) === 1 && $s['critical_jobs'][0]['job_name'] === 'rd.sincronizar' && $s['critical_jobs'][0]['error_count'] === 3
    && $s['summary'] === ['total_active_jobs' => 1, 'excellent_jobs' => 0, 'good_jobs' => 0, 'warning_jobs' => 1, 'critical_jobs' => 1], json_encode($s));
$d = $o->taxaDiariaLegado($agora, 30);
$ck('19: chart por dia de Brasília (12 dias, hoje com 4: asaas, rd, ml e o bling em andamento), summary e tendência das 2 semanas', count($d['chart_data']) === 12 && end($d['chart_data'])['date'] === '2026-11-27' && end($d['chart_data'])['total'] === 4
    && $d['summary']['total_executions'] === 17 && $d['summary']['avg_success_rate'] === 70.59 && $d['highlights'] === ['best_day' => null, 'worst_day' => null] && $d['trend']['previous_7d_avg'] === 100.0, json_encode($d['trend']));
foreach (['07', '13', '18', '19'] as $n) {
    $arq = "api/modules/panels/panel-$n/api.php"; $src = (string) file_get_contents("$RAIZ/$arq"); preg_match_all("~require(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'([^']+)'~", $src, $m);
    $falta = array_values(array_filter($m[1], fn($q) => !is_file(dirname("$RAIZ/$arq") . $q)));
    $ck("$arq: alcançável (" . count($m[1]) . " requires); troca depois do requireAuth e antes do cache; legado intacto", $falta === [] && strpos($src, 'requireAuth') < strpos($src, 'ObsConsumidor::ligado()')
        && strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')"), implode(',', $falta));
}
echo "teste-mig001-lote8: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
