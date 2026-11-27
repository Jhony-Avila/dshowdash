<?php
declare(strict_types=1);
// teste-mig001-lote10.php — MIG-001 lote 10 (VINHO, 27/11): panel-03 sobre o registro central. MySQL LOCAL, banco descartável zz_lote10_*.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote10_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');
$h = $o->horasLegado($agora, 24);
$ck('vazio: hourly vazio, contagens 0, taxa geral null; chaves do legado', $h === ['hourly' => [], 'period' => ['hours' => 24, 'total_executions' => 0, 'total_success' => 0, 'total_errors' => 0, 'overall_success_rate' => null]], json_encode($h));
foreach ([['13:37:00', 'ok', null, 60], ['13:50:00', 'falhou', 'fonte', 10], ['14:10:00', 'falhou', 'tempo', 30]] as [$t, $e, $c, $d]) { $ini = $T("2026-11-27 $t"); $j = 'j' . str_replace(':', '', $t);
    $o->iniciar($j, '-', $ini, 1, 3600, $ini); $o->encerrar($j, '-', $ini, 1, $e, $e === 'ok' ? 1 : null, $c, $ini->modify("+$d seconds")); }
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$o->iniciar('velho.job', '-', $T('2026-11-26 13:00:00'), 1, 60, $T('2026-11-26 13:00:00'));   // fora das 24 h
$h = $o->horasLegado($agora, 24);
$ck('por hora de Brasília, mais recente primeiro (11:00 com 2: tempo + rodando; 10:00 com 2: ok + erro)', array_column($h['hourly'], 'hour') === ['2026-11-27 11:00:00', '2026-11-27 10:00:00']
    && array_keys($h['hourly'][0]) === ['hour', 'total', 'success', 'errors', 'running', 'success_rate', 'avg_time', 'min_time', 'max_time'], json_encode($h['hourly']));
$ck('11:00: 2 execuções, 0 ok, 0 error (o tempo não é error), 1 rodando; tempos só da terminada (30 s)', $h['hourly'][0]['total'] === 2 && $h['hourly'][0]['errors'] === 0 && $h['hourly'][0]['running'] === 1
    && $h['hourly'][0]['success_rate'] === 0.0 && $h['hourly'][0]['avg_time'] === 30.0 && $h['hourly'][0]['min_time'] === 30.0, json_encode($h['hourly'][0]));
$ck('10:00: 1 ok + 1 error, taxa 50, média 35, mín 10, máx 60', $h['hourly'][1] === ['hour' => '2026-11-27 10:00:00', 'total' => 2, 'success' => 1, 'errors' => 1, 'running' => 0, 'success_rate' => 50.0, 'avg_time' => 35.0, 'min_time' => 10.0, 'max_time' => 60.0], json_encode($h['hourly'][1]));
$ck('period: 4 execuções em 24 h, 1 ok, 1 erro, taxa 25', $h['period'] === ['hours' => 24, 'total_executions' => 4, 'total_success' => 1, 'total_errors' => 1, 'overall_success_rate' => 25.0], json_encode($h['period']));
$arq = 'api/modules/panels/panel-03/api.php'; $src = (string) file_get_contents("$RAIZ/$arq"); preg_match_all("~require(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'([^']+)'~", $src, $m);
$falta = array_values(array_filter($m[1], fn($q) => !is_file(dirname("$RAIZ/$arq") . $q)));
$ck("$arq: alcançável; troca depois do requireAuth e antes do cache; o 503 do legado (P94) intacto abaixo", $falta === [] && strpos($src, 'requireAuth') < strpos($src, 'ObsConsumidor::ligado()')
    && strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "'motivo' => 'tempo_esgotado'"), implode(',', $falta));
echo "teste-mig001-lote10: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
