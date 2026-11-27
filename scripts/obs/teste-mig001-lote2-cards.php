<?php
declare(strict_types=1);
// teste-mig001-lote2-cards.php — MIG-001 lote 2 (VINHO, 27/11): cards 02, 03, 04, 08 e 10 sobre o registro central. MySQL LOCAL, banco temporário zz_lote2.
// Prova: (1) os números do registro (contagensDoDia) por dia civil de Brasília; (2) cada card monta o MESMO formato do legado (chaves iguais, `value`
// incluso) e a tela REAL (formatters.js) mostra o número; média sem base = null ("--"); (3) a troca só pela flag; registro fora = 503.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote2_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');   // 12:00 em Brasília
$ext = function (string $c): Closure { global $RAIZ; preg_match('/ObsConsumidor::responder\(\$CACHE_KEY, \(int\) \$CACHE_TTL, \'[^\']+\', (fn\(ObsExecucoes \$o\) => .*)\);\n/', (string) file_get_contents("$RAIZ/api/modules/cards/card-$c/api.php"), $m); return eval('return ' . $m[1] . ';'); };
$legado = function (string $c): array {   // chaves de PRIMEIRO nível do array do buildSuccess do legado (arrays internos removidos antes)
    global $RAIZ; $src = (string) file_get_contents("$RAIZ/api/modules/cards/card-$c/api.php");
    $i = strpos($src, 'buildSuccess([') + strlen('buildSuccess(['); $txt = substr($src, $i, strpos($src, '], [', $i) - $i);
    $txt = preg_replace('#//[^\n]*#', '', $txt); do { $txt = preg_replace('/\[[^\[\]]*\]/', 'X', $txt, -1, $n); } while ($n > 0);
    preg_match_all("/'([a-z_]+)' =>/", $txt, $mm); return array_values(array_unique($mm[1])); };
$cards = ['02', '03', '04', '08', '10'];
$vazio = []; foreach ($cards as $c) $vazio[$c] = $ext($c)($o);
$ck('registro vazio: 02 taxa null (subtitle "0 de 0"), 03/10 score null, 04 pico null, 08 por hora null — nunca 0 inventado',
    $vazio['02']['success_rate'] === null && $vazio['02']['value'] === null && $vazio['03']['score'] === null && $vazio['10']['value'] === null && $vazio['10']['total_jobs'] === 0
    && $vazio['04']['value'] === null && $vazio['08']['value'] === null, json_encode($vazio));
foreach ([['asaas.sincronizar', 'zenthra', '2026-11-27 13:37:00', 60, 'ok', null], ['asaas.sincronizar', 'rovic', '2026-11-27 13:37:00', 90, 'ok', null],
          ['rd.sincronizar', '-', '2026-11-27 13:41:00', 5, 'falhou', 'fonte'], ['bling.pedidos', '-', '2026-11-27 14:00:00', 30, 'falhou', 'tempo'],
          ['asaas.sincronizar', 'gav', '2026-11-27 02:30:00', 10, 'ok', null]] as [$j, $e, $ini, $dur, $est, $err]) {
    $o->iniciar($j, $e, $T($ini), 1, 3600, $T($ini)); $o->encerrar($j, $e, $T($ini), 1, $est, $est === 'ok' ? 1 : null, $err, $T($ini)->modify("+$dur seconds"));
}
$o->iniciar('pipedrive.sync', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$m = $o->metricasCards($agora);
$ck('métricas: 24 h = 6 (3 ok, 1 falha; a por tempo não conta), pico hoje 10h com 3, 5 execuções hoje em 1 h = 5,0/h, média da taxa 60 entre 5 jobs com dado, média do tempo 53,33 s, 6 jobs',
    $m['janela24h'] === ['total' => 6, 'ok' => 3, 'falhas' => 1] && $m['pico'] === ['hora' => 10, 'execucoes' => 3] && $m['por_hora_hoje'] === 5.0 && round($m['media_taxa'], 2) === 60.0 && round($m['media_tempo'], 2) === 53.33 && $m['jobs'] === 6, json_encode($m));
$s = []; foreach ($cards as $c) $s[$c] = $ext($c)($o);
$igual = true; $dif = ''; foreach ($s as $c => $x) if (array_keys($x) !== $legado((string) $c)) { $igual = false; $dif .= "$c: " . json_encode([array_keys($x), $legado((string) $c)]) . ' '; }
$ck('formato IDÊNTICO ao legado nos 5 cards (mesmas chaves, mesma ordem)', $igual, $dif);
$ck('valores: 02 "50%" (3 de 6), 03 score 60, 04 pico "10:00" com 3, 08 5,0/h, 10 performance 51 (60 − penalidade do tempo 53,33 s)', $s['02']['value'] === '50%' && $s['02']['success_rate'] === 50.0 && $s['02']['subtitle'] === '3 de 6 jobs ativos'
    && $s['03']['score'] === 60.0 && $s['03']['avg_time'] === 53.33 && $s['04']['value'] === '10:00' && $s['04']['details']['executions'] === 3 && $s['08']['value'] === 5.0 && $s['10']['value'] === 51.0 && $s['10']['total_jobs'] === 6, json_encode($s));
file_put_contents($tmp = sys_get_temp_dir() . '/lote2-' . getmypid() . '.json', json_encode(['cheio' => $s, 'vazio' => $vazio]));
$out = shell_exec('node ' . escapeshellarg("$RAIZ/scripts/obs/teste-mig001-lote2-cards-tela.mjs") . ' ' . escapeshellarg($tmp) . ' 2>&1');
rename($tmp, '/backup/vinho/' . basename($tmp));   // nada de rm
$ck('a tela REAL (formatters.js) mostra os números com o registro cheio e "--" com o registro vazio', trim((string) $out) === 'OK', (string) $out);
foreach ($cards as $c) { $src = (string) file_get_contents("$RAIZ/api/modules/cards/card-$c/api.php");
    $ck("card-$c: a troca vem antes do cache legado e só pela flag única; legado intacto abaixo", strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')")); }
echo "teste-mig001-lote2-cards: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
