<?php
declare(strict_types=1);
// teste-mig001-lote9.php — MIG-001 lote 9 (VINHO, 27/11): panels 14 e 02 sobre o registro central. MySQL LOCAL, banco descartável zz_lote9_*.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote9_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
// Prova: vazio = contagens 0 e médias null; chaves do legado; erros agrupados pelo CÓDIGO; SLA com null não vira "critical"; alcance e posição da troca.
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00'); $SLA = ['threshold_success_rate' => 95.0, 'threshold_duration_ms' => 30000, 'threshold_error_count' => 5];
$e = $o->errosLegado($agora, 7); $p = $o->painel02Legado($agora, $SLA);
$ck('vazio · 14: contagens 0, listas vazias, chaves do legado', array_keys($e) === ['period', 'statistics', 'top_errors', 'jobs_with_most_errors', 'errors_by_day']
    && $e['statistics'] === ['total_errors' => 0, 'jobs_with_errors' => 0, 'days_with_errors' => 0, 'avg_errors_per_day' => 0.0] && $e['top_errors'] === [] && $e['errors_by_day'] === [], json_encode($e));
$ck('vazio · 02: 0 jobs, média null, chaves do legado', array_keys($p) === ['overview', 'status_counts', 'jobs', 'meta'] && $p['jobs'] === [] && $p['overview']['metrics']['avg_success_rate'] === null
    && $p['status_counts'] === ['ok' => 0, 'warning' => 0, 'error' => 0] && $p['meta']['sla_defaults'] === $SLA, json_encode($p));
// massa: rd 3 falhas 'fonte' em 3 dias; ml 1 falha 'cobertura' hoje + 1 tempo (não é error); asaas 2 ok de 40 s; bling só rodando (sem taxa)
foreach ([2, 1, 0] as $i) { $ini = $T('2026-11-27 13:41:00')->modify("-$i days"); $o->iniciar('rd.sincronizar', '-', $ini, 1, 3600, $ini); $o->encerrar('rd.sincronizar', '-', $ini, 1, 'falhou', null, 'fonte', $ini->modify('+5 seconds')); }
foreach ([['13:10:00', 'cobertura'], ['14:10:00', 'tempo']] as [$h, $c]) { $ini = $T("2026-11-27 $h"); $o->iniciar('ml.pedidos', '-', $ini, 1, 3600, $ini); $o->encerrar('ml.pedidos', '-', $ini, 1, 'falhou', null, $c, $ini->modify('+3 seconds')); }
foreach (['12:37:00', '13:37:00'] as $h) { $ini = $T("2026-11-27 $h"); $o->iniciar('asaas.sincronizar', 'zenthra', $ini, 1, 3600, $ini); $o->encerrar('asaas.sincronizar', 'zenthra', $ini, 1, 'ok', 3, null, $ini->modify('+40 seconds')); }
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$e = $o->errosLegado($agora, 7);
$ck('14: 4 erros (o "tempo" não conta), 2 jobs, 3 dias; média 4/7', $e['statistics'] === ['total_errors' => 4, 'jobs_with_errors' => 2, 'days_with_errors' => 3, 'avg_errors_per_day' => 0.57], json_encode($e['statistics']));
$ck('14: top_errors pelo CÓDIGO (fonte 3, cobertura 1), chaves do legado, jobs_list e severidade', array_column($e['top_errors'], 'error_message') === ['fonte', 'cobertura'] && $e['top_errors'][0]['occurrences'] === 3
    && $e['top_errors'][0]['jobs_list'] === ['rd.sincronizar'] && $e['top_errors'][0]['severity'] === 'low'
    && array_keys($e['top_errors'][0]) === ['error_message', 'occurrences', 'affected_jobs', 'jobs_list', 'last_occurrence', 'first_occurrence', 'severity'], json_encode($e['top_errors']));
$ck('14: jobs_with_most_errors (rd 3 em 3 dias) e errors_by_day (hoje primeiro: 2 erros, 2 jobs)', $e['jobs_with_most_errors'][0]['job_name'] === 'rd.sincronizar' && $e['jobs_with_most_errors'][0]['days_with_errors'] === 3
    && $e['errors_by_day'][0] === ['date' => '2026-11-27', 'error_count' => 2, 'affected_jobs' => 2] && count($e['errors_by_day']) === 3, json_encode($e['errors_by_day']));
$p = $o->painel02Legado($agora, $SLA); $por = array_column($p['jobs'], null, 'job_name');
$ck('02: bling (só rodando) → SLA todo null e health_status null (o legado dava "critical" por 0)', $por['bling.pedidos']['health_status'] === null && $por['bling.pedidos']['sla']['success_rate']['status'] === null
    && $por['bling.pedidos']['sla']['success_rate']['value'] === null, json_encode($por['bling.pedidos']));
$ck('02: asaas 100%, 40 s (40000 ms > 30000 → warning) → warning; rd 0% → critical; chaves do legado', $por['asaas.sincronizar@zenthra']['health_status'] === 'warning' && $por['rd.sincronizar']['health_status'] === 'critical'
    && array_keys($p['jobs'][0]) === ['id', 'job_name', 'job_type', 'is_active', 'is_running', 'last_execution', 'last_success', 'total_executions', 'success_rate', 'error_count', 'avg_execution_time', 'created_at', 'updated_at', 'sla', 'health_status'], json_encode($p['jobs'][0]));
$ck('02: ordem do legado (taxa < 95 primeiro: ml e rd; depois os outros pela última execução) e overview', array_column($p['jobs'], 'job_name') === ['ml.pedidos', 'rd.sincronizar', 'bling.pedidos', 'asaas.sincronizar@zenthra']
    && $p['overview']['health'] === ['healthy' => 0, 'warning' => 1, 'critical' => 2] && $p['overview']['metrics']['avg_success_rate'] === 33.33 && $p['status_counts'] === ['ok' => 0, 'warning' => 1, 'error' => 2], json_encode([array_column($p['jobs'], 'job_name'), $p['overview']]));
foreach (['14', '02'] as $n) {
    $arq = "api/modules/panels/panel-$n/api.php"; $src = (string) file_get_contents("$RAIZ/$arq"); preg_match_all("~require(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'([^']+)'~", $src, $m);
    $falta = array_values(array_filter($m[1], fn($q) => !is_file(dirname("$RAIZ/$arq") . $q)));
    $ck("$arq: alcançável (" . count($m[1]) . " requires); troca depois do requireAuth e antes do cache; legado intacto", $falta === [] && strpos($src, 'requireAuth') < strpos($src, 'ObsConsumidor::ligado()')
        && strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')"), implode(',', $falta));
}
$src = (string) file_get_contents("$RAIZ/api/modules/panels/panel-02/api.php");
$ck('02: os limites passados ao molde = os $slaDefaults do legado', str_contains($src, "\$slaDefaults = ['threshold_success_rate' => 95.0, 'threshold_duration_ms' => 30000, 'threshold_error_count' => 5];"));
echo "teste-mig001-lote9: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
