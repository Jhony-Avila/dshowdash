<?php
declare(strict_types=1);
// teste-mig001-lote12.php — MIG-001 lote 12 (VINHO, 27/11): panel-15 total-jobs, active-jobs, running-jobs e success-rate sobre o registro central. MySQL LOCAL, banco descartável zz_lote12_*.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote12_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$ck('vazio: contagens 0 de verdade; taxa null (o legado dava 0); chaves e rótulos do legado', $o->painel15MetricaLegado('total_jobs') === ['metric' => 'total_jobs', 'value' => 0, 'label' => 'Total']
    && $o->painel15MetricaLegado('success_rate') === ['metric' => 'success_rate', 'value' => null, 'label' => 'Taxa Sucesso']);
foreach ([['asaas.sincronizar', 'ok'], ['rd.sincronizar', 'falhou']] as [$j, $e]) { $ini = $T('2026-11-27 13:00:00'); $o->iniciar($j, '-', $ini, 1, 3600, $ini); $o->encerrar($j, '-', $ini, 1, $e, $e === 'ok' ? 1 : null, $e === 'ok' ? null : 'fonte', $ini->modify('+5 seconds')); }
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$ck('3 jobs, 3 ativos, 1 rodando, taxa média 50.0 (asaas 100, rd 0; bling sem terminada fica fora)', $o->painel15MetricaLegado('total_jobs')['value'] === 3 && $o->painel15MetricaLegado('active_jobs')['value'] === 3
    && $o->painel15MetricaLegado('running_jobs') === ['metric' => 'running_jobs', 'value' => 1, 'label' => 'Rodando'] && $o->painel15MetricaLegado('success_rate')['value'] === 50.0);
foreach (['total-jobs', 'active-jobs', 'running-jobs', 'success-rate'] as $d) {
    $arq = "api/modules/panels/panel-15/$d/api.php"; $src = (string) file_get_contents("$RAIZ/$arq"); preg_match_all("~require(?:_once)?\s*\(?\s*__DIR__\s*\.\s*'([^']+)'~", $src, $mm);
    $falta = array_values(array_filter($mm[1], fn($q) => !is_file(dirname("$RAIZ/$arq") . $q)));
    $ck("$arq: alcançável; troca depois do requireAuth e antes do cache; legado intacto", $falta === [] && strpos($src, 'requireAuth') < strpos($src, 'ObsConsumidor::ligado()')
        && strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')"), implode(',', $falta));
}
echo "teste-mig001-lote12: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
