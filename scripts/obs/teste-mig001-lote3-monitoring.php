<?php
declare(strict_types=1);
// teste-mig001-lote3-monitoring.php — MIG-001 lote 3 (VINHO, 27/11): api/monitoring: get_cron_jobs_status, get_cron_jobs_minimal, get_cron_status, cache_jobs, running_scripts sobre o registro central. MySQL LOCAL, banco temporário zz_lote3.
// Prova: (1) os números do registro (contagensDoDia) por dia civil de Brasília; (2) cada card monta o MESMO formato do legado (chaves iguais, `value`
// incluso) e a tela REAL (formatters.js) mostra o número; média sem base = null ("--"); (3) a troca só pela flag; registro fora = 503.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote3_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$rotas = ['get_cron_jobs_status' => 'cron-jobs-status', 'get_cron_jobs_minimal' => 'cron-jobs-minimal', 'get_cron_status' => 'cron-status', 'cache_jobs' => 'cache-jobs', 'running_scripts' => 'running-scripts'];
// colunas do legado = a lista do SELECT … FROM sync_jobs do próprio arquivo (o "AS active_count" incluso)
$colunas = function (string $f) use ($RAIZ): array { $s = (string) file_get_contents("$RAIZ/api/monitoring/$f.php"); preg_match('/SELECT (.*?) FROM sync_jobs WHERE/s', $s, $m);
    $c = []; foreach (preg_split('/,(?![^()]*\))/', $m[1]) as $p) { $p = trim($p); $c[] = preg_match('/ as ([a-z_]+)$/i', $p, $mm) ? $mm[1] : $p; } return $c; };
$vazios = []; foreach ($rotas as $arq => $r) $vazios[$r] = ObsExecucoes::monitoringLegado($r, $o->comoSyncJobs());
$ck('registro vazio: listas vazias; totais 0 de verdade, exceto cron/cache (dependem do catálogo) = null', $vazios['cron-jobs-minimal'] === ['jobs' => [], 'total' => 0] && $vazios['cron-status']['stats']['total'] === 0
    && $vazios['running-scripts'] === ['scripts' => [], 'count' => 0] && $vazios['cron-jobs-status'] === ['jobs' => [], 'total' => null] && $vazios['cache-jobs'] === ['jobs' => [], 'total' => null]);
$U = new DateTimeZone('UTC');
$o->iniciar('rd.sincronizar', '-', $T('2026-11-27 13:41:00'), 1, 3600, $T('2026-11-27 13:41:00')); $o->encerrar('rd.sincronizar', '-', $T('2026-11-27 13:41:00'), 1, 'falhou', null, 'fonte', $T('2026-11-27 13:41:05'));
$o->iniciar('asaas.sincronizar', 'zenthra', $T('2026-11-27 13:37:00'), 1, 3600, $T('2026-11-27 13:37:00')); $o->encerrar('asaas.sincronizar', 'zenthra', $T('2026-11-27 13:37:00'), 1, 'ok', 3, null, $T('2026-11-27 13:38:00'));
$o->iniciar('bling.pedidos', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));   // em andamento
$sj = $o->comoSyncJobs(); $s = []; foreach ($rotas as $arq => $r) $s[$arq] = ObsExecucoes::monitoringLegado($r, $sj);
$ig = true; $dif = '';
foreach (['get_cron_jobs_minimal' => 'jobs', 'get_cron_status' => 'jobs', 'running_scripts' => 'scripts'] as $arq => $k) {
    $leg = $colunas($arq); $nov = isset($s[$arq][$k][0]) ? array_keys($s[$arq][$k][0]) : null;
    if ($nov !== null && $nov !== $leg) { $ig = false; $dif .= "$arq: " . json_encode([$nov, $leg]) . ' '; }
}
$ck('formato IDÊNTICO: as colunas de cada linha = a lista do SELECT do legado, na mesma ordem; chaves do topo iguais', $ig && array_keys($s['get_cron_status']) === ['jobs', 'stats']
    && array_keys($s['running_scripts']) === ['scripts', 'count'] && array_keys($s['get_cron_jobs_minimal']) === ['jobs', 'total'], $dif);
$ck('valores: minimal em ordem de nome (3); status com stats (3 jobs, 1 rodando, 1 com erro); running só o bling (active_count 1); inexistentes = null',
    array_column($s['get_cron_jobs_minimal']['jobs'], 'job_name') === ['asaas.sincronizar@zenthra', 'bling.pedidos', 'rd.sincronizar']
    && $s['get_cron_status']['stats'] === ['total' => 3, 'active' => 3, 'running' => 1, 'with_errors' => 1]
    && $s['running_scripts']['count'] === 1 && $s['running_scripts']['scripts'][0]['job_name'] === 'bling.pedidos' && $s['running_scripts']['scripts'][0]['active_count'] === 1
    && $s['get_cron_status']['jobs'][0]['id'] === null && $s['get_cron_status']['jobs'][0]['cron_expression'] === null, json_encode($s));
foreach (array_keys($rotas) as $arq) { $src = (string) file_get_contents("$RAIZ/api/monitoring/$arq.php");
    $ck("$arq: troca antes do cache legado, só pela flag única; legado intacto abaixo", strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')") && str_contains($src, "monitoringLegado('" . $rotas[$arq] . "'")); }
echo "teste-mig001-lote3-monitoring: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
