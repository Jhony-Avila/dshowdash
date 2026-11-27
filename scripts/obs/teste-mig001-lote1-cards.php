<?php
declare(strict_types=1);
// teste-mig001-lote1-cards.php — MIG-001 lote 1 (VINHO, 27/11): cards 05, 06, 07, 09 e 11 sobre o registro central. MySQL LOCAL, banco temporário zz_lote1.
// Prova: (1) os números do registro (contagensDoDia) por dia civil de Brasília; (2) cada card monta o MESMO formato do legado (chaves iguais, `value`
// incluso) e a tela REAL (formatters.js) mostra o número; média sem base = null ("--"); (3) a troca só pela flag; registro fora = 503.
$RAIZ = dirname(__DIR__, 2);
require_once "$RAIZ/api/obs/ObsExecucoes.php";
$ok = 0; $f = []; $ck = function (string $n, bool $c, string $i = '') use (&$ok, &$f) { $c ? $ok++ : $f[] = $n; echo ($c ? 'ok    ' : 'FALHA ') . $n . (!$c && $i ? " · $i" : '') . "\n"; };
$root = new PDO('mysql:unix_socket=/run/mysqld/mysqld.sock;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$ZZ = 'zz_lote1_' . date('Ymd_His');   // nome único por execução; o banco descartável é apagado no fim (regra do arquiteto 05:00)
if ($root->query("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = '{$ZZ}'")->fetchColumn()) { echo "{$ZZ} já existe — abortado\n"; exit(2); }
register_shutdown_function(fn() => $root->exec("DROP DATABASE IF EXISTS $ZZ"));
$root->exec("CREATE DATABASE $ZZ; USE $ZZ;"); $root->exec(file_get_contents("$RAIZ/scripts/obs/migracao-obs001-execucoes.sql"));
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$ZZ;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$o = new ObsExecucoes($pdo); $U = new DateTimeZone('UTC'); $T = fn(string $d) => new DateTimeImmutable($d, $U);
$agora = $T('2026-11-27 15:00:00');   // 12:00 em Brasília
$vazio = $o->contagensDoDia($agora);
$ck('registro vazio: contagens 0 de verdade, tempo médio null (nunca 0)', $vazio === ['concluidas' => 0, 'falhas' => 0, 'total' => 0, 'tempo_medio_s' => null, 'ativos' => 0], json_encode($vazio));
// hoje (Brasília): 2 ok (60 s e 90 s), 1 falhou/fonte, 1 falhou/tempo, 1 em andamento; ontem à noite em Brasília (02:30 UTC de hoje) não conta
foreach ([['asaas.sincronizar', 'zenthra', '2026-11-27 13:37:00', 60, 'ok', null], ['asaas.sincronizar', 'rovic', '2026-11-27 13:37:00', 90, 'ok', null],
          ['rd.sincronizar', '-', '2026-11-27 13:41:00', 5, 'falhou', 'fonte'], ['bling.pedidos', '-', '2026-11-27 14:00:00', 30, 'falhou', 'tempo'],
          ['asaas.sincronizar', 'gav', '2026-11-27 02:30:00', 10, 'ok', null]] as [$j, $e, $ini, $dur, $est, $err]) {
    $o->iniciar($j, $e, $T($ini), 1, 3600, $T($ini)); $o->encerrar($j, $e, $T($ini), 1, $est, $est === 'ok' ? 1 : null, $err, $T($ini)->modify("+$dur seconds"));
}
$o->iniciar('pipedrive.sync', '-', $T('2026-11-27 14:50:00'), 1, 3600, $T('2026-11-27 14:50:00'));
$d = $o->contagensDoDia($agora);
$ck('dia civil de Brasília: concluídas 2, falhas 1 (por tempo não conta como falha, igual ao legado "error"), total 5 (inclui a em andamento), média 46,25 s das terminadas, ativos 6 (todo job+escopo já registrado, inclusive o de ontem)',
    $d['concluidas'] === 2 && $d['falhas'] === 1 && $d['total'] === 5 && $d['tempo_medio_s'] === 46.25 && $d['ativos'] === 6, json_encode($d));
// cada card: o closure do api.php monta o mesmo formato do legado; a tela REAL mostra o número
$saida = []; $legado = [];
foreach (['05', '06', '07', '09', '11'] as $c) {
    $src = (string) file_get_contents("$RAIZ/api/modules/cards/card-$c/api.php");
    preg_match('/ObsConsumidor::responder\(\$CACHE_KEY, \(int\) \$CACHE_TTL, \'[^\']+\', (fn\(ObsExecucoes \$o\) => .*)\);\n/', $src, $m);
    $fn = eval('return ' . $m[1] . ';');
    $saida[$c] = $fn($o);
    preg_match_all("/^\\s+'([a-z_]+)' =>/m", substr($src, strpos($src, 'buildSuccess([')), $mm); $legado[$c] = array_values(array_unique($mm[1]));
}
$chavesIguais = true; foreach ($saida as $c => $x) if (array_keys($x) !== $legado[$c]) { $chavesIguais = false; $dif = "$c: " . json_encode([array_keys($x), $legado[$c]]); }
$ck('formato IDÊNTICO ao legado: mesmas chaves, na mesma ordem, nos 5 cards (value incluso)', $chavesIguais, $dif ?? '');
$ck('valores: 05 = 2 concluídas, 06 = 1 falha, 07 = 6 ativos, 09 = 5 execuções, 11 = 46,25 s', $saida['05']['value'] === 2 && $saida['06']['value'] === 1 && $saida['07']['value'] === 6
    && $saida['09']['value'] === 5 && $saida['11']['value'] === 46.25 && $saida['11']['formatted'] === '46s', json_encode($saida));
$pdo->exec('DELETE FROM obs_posse'); $pdo->exec('DELETE FROM obs_execucao');
$f11 = (fn() => eval('return ' . (preg_match('/ObsConsumidor::responder\(\$CACHE_KEY, \(int\) \$CACHE_TTL, \'[^\']+\', (fn\(ObsExecucoes \$o\) => .*)\);\n/', (string) file_get_contents("$RAIZ/api/modules/cards/card-11/api.php"), $m2) ? $m2[1] : 'null') . ';'))();
$ck('card 11 sem execução terminada hoje: value/average_time/formatted null (a tela mostra "--"), nunca 0', ($s11 = $f11($o))['value'] === null && $s11['average_time'] === null && $s11['formatted'] === null);
file_put_contents($tmp = sys_get_temp_dir() . '/lote1-' . getmypid() . '.json', json_encode($saida + ['11v' => $s11]));
$out = shell_exec('node ' . escapeshellarg("$RAIZ/scripts/obs/teste-mig001-lote1-cards-tela.mjs") . ' ' . escapeshellarg($tmp) . ' 2>&1');
rename($tmp, '/backup/vinho/' . basename($tmp));   // nada de rm: o temporário vai para /backup/vinho
$ck('a tela REAL (formatters.js) mostra: 05 "2", 06 "1", 07 "6", 09 "5", 11 "46s"; 11 sem base "--"', trim((string) $out) === 'OK', (string) $out);
foreach (['05', '06', '07', '09', '11'] as $c) {
    $src = (string) file_get_contents("$RAIZ/api/modules/cards/card-$c/api.php");
    $ck("card-$c: a troca vem ANTES do cache legado e só pela flag única; legado intacto abaixo", strpos($src, 'ObsConsumidor::ligado()') < strpos($src, 'RedisHelper::serveIfCached($CACHE_KEY)') && str_contains($src, "getConnection('INTEGRACAO')"));
}
$oc = (string) file_get_contents("$RAIZ/api/obs/ObsConsumidor.php");
$ck('molde único: flag obs_monitoramento via fonteRegistroLigada; cache "obs:"; registro fora = 503 indisponível', str_contains($oc, 'ObsExecucoes::fonteRegistroLigada(') && str_contains($oc, "'obs:' . \$chaveLegado") && str_contains($oc, "503, ['fonte' => 'registro_execucoes', 'estado' => 'indisponivel']"));
echo "teste-mig001-lote1-cards: $ok ok, ", count($f), " falha(s)\n"; exit($f === [] ? 0 : 1);
