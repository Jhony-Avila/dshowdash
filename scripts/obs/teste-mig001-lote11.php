<?php
declare(strict_types=1);
// teste-mig001-lote11.php — MIG-001 lote 11 (VINHO, 27/11): dashboard filtered_data, historical_data e dashboard_metrics_final sobre o registro central. MySQL LOCAL, banco descartável zz_lote11_*.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote11_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');
$ck('vazio: filtered vazio em todas as entidades; histórico com médias null; métricas com média null, alertas/servidor null',
    $o->filtradoLegado('executions', 'day', '2026-11-20', '2026-11-27') === [] && $o->filtradoLegado('jobs', 'day', '2026-11-20', '2026-11-27') === []
    && ($h = $o->historicoLegado('', '', '2026-11-20', '2026-11-27', 500))['statistics'] === ['total_executions' => 0, 'successful' => 0, 'failed' => 0, 'avg_time' => null, 'max_time' => null, 'min_time' => null]
    && ($m = $o->metricasFinaisLegado($agora))['jobs']['avg_success_rate'] === null && $m['server'] === null && $m['alerts']['total'] === null);
// massa: asaas ok 60 s em 25/11 10:37 BR; rd falha 'fonte' 26/11 10:41 BR; ml tempo 27/11 11:10 BR; bling rodando 27/11 11:50 BR; um 'zz.antigo' fora (10/11)
foreach ([['asaas.sincronizar', '2026-11-25 13:37:00', 'ok', null, 60], ['rd.sincronizar', '2026-11-26 13:41:00', 'falhou', 'fonte', 5], ['ml.pedidos', '2026-11-27 14:10:00', 'falhou', 'tempo', 30], ['zz.antigo', '2026-11-10 13:00:00', 'ok', null, 9]] as [$j, $t, $e, $c, $d]) {
    $ini = $T($t); $o->iniciar($j, '-', $ini, 1, 3600, $ini); $o->encerrar($j, '-', $ini, 1, $e, $e === 'ok' ? 4 : null, $c, $ini->modify("+$d seconds")); }
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$ex = $o->filtradoLegado('executions', 'day', '2026-11-20', '2026-11-27');
$ck('filtered executions/day: janela do legado (até 27/11 00:00 — o dia 27 fica FORA, como no legado); 25/11 1 ok, 26/11 1 falha; avg_time das terminadas', array_column($ex, 'period') === ['2026-11-25', '2026-11-26']
    && $ex[0] === ['period' => '2026-11-25', 'total_executions' => 1, 'successful' => 1, 'failed' => 0, 'avg_time' => 60.0] && $ex[1]['failed'] === 1, json_encode($ex));
$ex2 = $o->filtradoLegado('executions', 'day', '2026-11-20', '2026-11-28');
$ck('filtered até 28/11: 27/11 com 2 (tempo não é failed; rodando sem tempo)', end($ex2)['period'] === '2026-11-27' && end($ex2)['total_executions'] === 2 && end($ex2)['failed'] === 0 && end($ex2)['avg_time'] === 30.0, json_encode($ex2));
$er = $o->filtradoLegado('errors', 'week', '2026-11-01', '2026-11-28');
$ck('filtered errors/week: só o erro de verdade (rd, 26/11 = semana %U 47)', $er === [['period' => '2026-47', 'error_count' => 1]], json_encode($er));
$pf = $o->filtradoLegado('performance', 'day', '2026-11-01', '2026-11-28');
$ck('filtered performance: só as ok, mais lento primeiro (asaas 60 s, zz.antigo 9 s)', array_column($pf, 'job_name') === ['asaas.sincronizar', 'zz.antigo'] && $pf[0]['executions'] === 1, json_encode($pf));
$jb = $o->filtradoLegado('jobs', 'month', '2026-11-01', '2026-11-28');
$ck('filtered jobs/month: os 5 jobs com última execução em nov; média das taxas só dos que têm taxa', $jb[0]['period'] === '2026-11' && $jb[0]['total_jobs'] === 5 && $jb[0]['avg_success_rate'] !== null, json_encode($jb));
$hi = $o->historicoLegado('SINCRO', '', '2026-11-20', '2026-11-27', 500);
$ck('historical: "contém" sem diferenciar maiúsculas (2 sincronizar), até 27/11 23:59:59, mais recente primeiro; chaves do legado', array_column($hi['history'], 'job_name') === ['rd.sincronizar', 'asaas.sincronizar']
    && array_keys($hi['history'][0]) === ['id', 'job_name', 'status', 'execution_start', 'execution_end', 'execution_time_seconds', 'rows_affected', 'error_message', 'run_id', 'exit_code'] && $hi['history'][0]['error_message'] === 'fonte', json_encode($hi['history']));
$h2 = $o->historicoLegado('', 'timeout', '2026-11-20', '2026-11-27', 500);
$ck('historical status=timeout: só o ml; estatística SEM o filtro de status (como o legado): 4 na janela', array_column($h2['history'], 'job_name') === ['ml.pedidos'] && $h2['statistics']['total_executions'] === 4 && $h2['total'] === 1, json_encode($h2['statistics']));
$m = $o->metricasFinaisLegado($agora);
$ck('metrics_final: 5 jobs, 1 rodando, 2 com erro (error_count do comoSyncJobs conta o tempo, como no lote 3); 24 h: 2 (ml tempo + bling), 0 erro; alertas e servidor null', $m['jobs']['total'] === 5 && $m['jobs']['running'] === 1 && $m['jobs']['with_errors'] === 2
    && $m['executions']['last_24h']['total'] === 2 && $m['executions']['last_24h']['error'] === 0 && $m['server'] === null, json_encode($m));
foreach (['api/dashboard/filtered_data.php', 'api/dashboard/historical_data.php', 'api/dashboard/dashboard_metrics_final.php'] as $arq) {
    $src = (string) file_get_contents("$RAIZ/$arq"); preg_match_all("~require(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'([^']+)'~", $src, $mm);
    $falta = array_values(array_filter($mm[1], fn($q) => !is_file(dirname("$RAIZ/$arq") . $q)));
    $ck("$arq: alcançável; troca depois do SessionGate::validate e antes do cache; legado intacto", $falta === [] && strpos($src, 'SessionGate::validate()') < strpos($src, 'ObsConsumidor::ligado()')
        && strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')"), implode(',', $falta));
}
echo "teste-mig001-lote11: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
