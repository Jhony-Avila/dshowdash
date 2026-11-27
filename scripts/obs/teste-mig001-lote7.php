<?php
declare(strict_types=1);
// teste-mig001-lote7.php — MIG-001 lote 7 (VINHO, 27/11): card-01 e panels 15/17 sobre o registro central. MySQL LOCAL, banco descartável zz_lote7_*.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote7_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
// Prova: (1) registro vazio = contagens 0 de verdade e médias/taxas null (nunca 0 inventado); (2) chaves IGUAIS às do legado; (3) números certos
// por dia/hora de Brasília; (4) cada endpoint ALCANÇÁVEL (todo require com __DIR__ existe — a lição do lote 6) e a troca só pela flag, antes do cache.
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');   // 12:00 em Brasília
$CH01 = ['total_jobs', 'active_jobs', 'success_rate', 'successRate', 'avg_execution_time', 'success', 'sucesso', 'error', 'erro', 'errors', 'total_executions_today', 'history'];
$c = $o->card01Legado($agora); $g = $o->painelVisaoGeralLegado();
$ck('vazio · card-01: chaves do legado; contagens 0; taxa e tempo médio null; history vazio', array_keys($c) === $CH01 && $c['total_jobs'] === 0 && $c['total_executions_today'] === 0
    && $c['success_rate'] === null && $c['avg_execution_time'] === null && $c['history'] === [], json_encode($c));
$ck('vazio · overview: média null; alertas null (o registro não tem alertas); listas vazias', $g['overview'] === ['total_jobs' => 0, 'active_jobs' => 0, 'running_jobs' => 0, 'avg_success_rate' => null]
    && $g['alerts_summary'] === ['total' => null, 'critical' => null, 'warning' => null] && $g['recent_activity'] === [] && $g['top_jobs'] === [], json_encode($g));
foreach ([['asaas.sincronizar', 'zenthra', '2026-11-26 20:37:00', 30, 'ok'], ['asaas.sincronizar', 'zenthra', '2026-11-27 13:37:00', 60, 'ok'], ['asaas.sincronizar', 'zenthra', '2026-11-27 14:37:00', 120, 'ok'],
          ['rd.sincronizar', '-', '2026-11-27 13:41:00', 5, 'falhou'], ['rd.sincronizar', '-', '2026-11-27 14:41:00', 5, 'tempo']] as [$j, $es, $ini, $dur, $est]) {
    $fim = $est === 'tempo' ? 'falhou' : $est;
    $o->iniciar($j, $es, $T($ini), 1, 3600, $T($ini)); $o->encerrar($j, $es, $T($ini), 1, $fim, $fim === 'ok' ? 1 : null, $fim === 'ok' ? null : ($est === 'tempo' ? 'tempo' : 'fonte'), $T($ini)->modify("+$dur seconds"));
}
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$c = $o->card01Legado($agora); $g = $o->painelVisaoGeralLegado();
$ck('card-01: hoje (Brasília) 5 execuções, 2 ok, 1 erro (o "tempo" não conta como error, como no legado), taxa 40.0; 3 jobs', $c['total_executions_today'] === 5 && $c['success'] === 2 && $c['sucesso'] === 2
    && $c['error'] === 1 && $c['errors'] === 1 && $c['success_rate'] === 40.0 && $c['successRate'] === 40.0 && $c['total_jobs'] === 3 && $c['active_jobs'] === 3, json_encode($c));
$ck('card-01: history = últimas 24 h por hora de Brasília (a de ontem 17:37 entra; hora sem execução não aparece), rate por hora', array_column($c['history'], 'hour') === ['2026-11-26 17:00:00', '2026-11-27 10:00:00', '2026-11-27 11:00:00']
    && $c['history'][1] === ['hour' => '2026-11-27 10:00:00', 'rate' => 50.0, 'total' => 2, 'success' => 1] && $c['history'][2]['total'] === 3, json_encode($c['history']));
$ck('card-01: tempo médio = média dos avg_execution_time dos jobs (asaas 70 s, rd sem ok = fora) → 70.0', $c['avg_execution_time'] === 70.0, json_encode($c));
$ck('overview: chaves do legado; 3 jobs, 1 rodando; média das taxas (asaas 100, rd 0) = 50.0', array_keys($g) === ['overview', 'recent_activity', 'top_jobs', 'alerts_summary']
    && $g['overview'] === ['total_jobs' => 3, 'active_jobs' => 3, 'running_jobs' => 1, 'avg_success_rate' => 50.0], json_encode($g['overview']));
$ck('overview: recent_activity (mais recente primeiro; running, timeout e error mapeados) e top_jobs por total_executions, chaves do legado',
    array_keys($g['recent_activity'][0]) === ['job_name', 'status', 'execution_start', 'execution_time_seconds'] && array_column($g['recent_activity'], 'status') === ['running', 'timeout', 'success', 'error', 'success', 'success']
    && array_keys($g['top_jobs'][0]) === ['job_name', 'total_executions', 'success_rate', 'avg_execution_time'] && array_column($g['top_jobs'], 'job_name') === ['asaas.sincronizar@zenthra', 'rd.sincronizar', 'bling.pedidos'], json_encode($g));
foreach (['api/modules/cards/card-01/api.php', 'api/modules/panels/panel-15/api.php', 'api/modules/panels/panel-17/api.php'] as $arq) {
    $src = (string) file_get_contents("$RAIZ/$arq"); preg_match_all("~require(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'([^']+)'~", $src, $m);
    $falta = array_values(array_filter($m[1], fn($r) => !is_file(dirname("$RAIZ/$arq") . $r)));
    $ck("$arq: alcançável (requires existem: " . count($m[1]) . "); troca antes do cache legado, só pela flag; legado intacto", $falta === [] && strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)')
        && str_contains($src, "getConnection('INTEGRACAO')") && (!str_contains($src, 'requireAuth') || strpos($src, 'requireAuth') < strpos($src, 'ObsConsumidor::ligado()')), implode(',', $falta));
}
echo "teste-mig001-lote7: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
