<?php
// HL-001-R1 (AZUL, 27/11) — regras do /api/health e do coletor, SEM banco e SEM rede externa (as sondas do coletor vão só a 127.0.0.1).
// 1 decisão pelo valor NÃO arredondado, 92% bloqueia, 85% avisa · 2 agregado monotônico e crítico ausente = falha · 3 fotografia remota
// (atômica, permissão restrita, release, idade; vencida = informativo marcado) · 4 memória 85/95 e orçamento por check ≤ 120 ms.
declare(strict_types=1);
$raiz = realpath(__DIR__ . '/../..');
require $raiz . '/api/core/HealthAgregado.php';
$f = []; $n = 0; $ok = static function (bool $c, string $nome) use (&$f, &$n): void { $n++; if (!$c) { $f[] = $nome; } };
// (2) monotônico
$H = 'HEALTHY'; $D = 'DEGRADED'; $U = 'UNHEALTHY';
$ok(HealthAgregado::piorar($U, $D) === $U && HealthAgregado::piorar($U, $H) === $U && HealthAgregado::piorar($D, $H) === $D && HealthAgregado::piorar($H, $D) === $D && HealthAgregado::piorar($D, $U) === $U, '2 agregado monotônico: nunca rebaixa UNHEALTHY nem DEGRADED');
$ok(HealthAgregado::piorar($H, 'OK') === $U, '2 estado desconhecido no agregado = UNHEALTHY (nunca melhora)');
$seq = $H; foreach ([$D, $U, $D, $H] as $x) { $seq = HealthAgregado::piorar($seq, $x); }
$ok($seq === $U, '2 sequência D → U → D → H termina UNHEALTHY');
// (1) disco: valor bruto
$u = static fn (float $t, float $l) => HealthAgregado::nivelUso('disco', $t, $l);
$ok($u(100000, 15001)['rotulo'] === 'OK' && $u(100000, 15000)['rotulo'] === 'WARNING' && $u(100000, 8001)['rotulo'] === 'WARNING' && $u(100000, 8000)['rotulo'] === 'CRITICAL', '1 fronteiras do disco: 84,999 OK · 85 aviso · 91,999 aviso · 92 bloqueio');
$r = $u(100000, 8040);   // 91,96 % → arredondaria para 92,0
$ok($r['rotulo'] === 'WARNING' && $r['agregado'] === $H && round($r['uso'], 1) === 92.0, '1 91,96% (que arredonda para 92,0) continua AVISO: decide o valor bruto');
$ok($u(100000, 8000)['agregado'] === $U && $u(100000, 15000)['agregado'] === $H && $u(100000, 15000)['aviso'] === true, '1 bloqueio piora para UNHEALTHY; aviso não piora o agregado');
$ok(HealthAgregado::nivelUso('disco', false, 1.0)['agregado'] === $U && HealthAgregado::nivelUso('disco', 10.0, 11.0)['agregado'] === $U, '2 disco ilegível/inválido = crítico ausente = UNHEALTHY');
// (4) memória
[$mt, $md] = HealthAgregado::memoria("MemTotal:       1000000 kB\nMemFree: 10 kB\nMemAvailable:     50000 kB\n");
$ok($mt === 1000000 && $md === 50000 && HealthAgregado::nivelUso('memoria', $mt, $md)['rotulo'] === 'CRITICAL', '4 memória: 95% (MemAvailable) = bloqueio');
$ok(HealthAgregado::nivelUso('memoria', 1000000, 50001)['rotulo'] === 'WARNING' && HealthAgregado::nivelUso('memoria', 1000000, 150001)['rotulo'] === 'OK', '4 memória: 94,99% aviso · 84,99% ok');
$ok(HealthAgregado::memoria(false) === [false, false] && HealthAgregado::memoria("MemTotal: 10 kB\n") === [false, false] && HealthAgregado::nivelUso('memoria', false, false)['agregado'] === $U, '2 memória ilegível = crítico ausente = UNHEALTHY');
$ok(array_sum(HealthAgregado::ORCAMENTO_MS) <= 120, '4 orçamento por check soma ≤ 120 ms (p95 HTTP < 200 ms com folga) · soma ' . array_sum(HealthAgregado::ORCAMENTO_MS));
// (3) fotografia remota
$tmp = sys_get_temp_dir() . '/esq-hr1-' . getmypid(); mkdir($tmp, 0755);
$arq = "$tmp/remote-v4.json"; $rel = str_repeat('a', 40); $agora = time();
$foto = static fn (array $b, int $quando, ?string $r = null) => ['versao' => 1, 'gerado_em' => $quando, 'release' => $r ?? $rel, 'bancos' => $b];
$fr = static fn (?string $releaseServida = null) => HealthAgregado::fotografiaRemota($arq, $releaseServida ?? $rel, $agora);
$ok($fr()['coleta'] === 'sem_fotografia' && $fr()['bancos']['DSHOW_PROD']['status'] === 'UNKNOWN', '3 sem fotografia = UNKNOWN marcado (sem_fotografia)');
HealthAgregado::gravarAtomico($arq, $foto(['INTEGRACAO' => ['estado' => 'ok'], 'DSHOW_PROD' => ['estado' => 'falhou']], $agora - 5));
$st = stat($arq); $sobras = glob("$tmp/.foto-*");
$ok(($st['mode'] & 0777) === 0644 && $sobras === [], '3 gravação atômica: 0644 e nenhum temporário sobrando');
$r = $fr();
$ok($r['coleta'] === 'ok' && $r['idade_s'] === 5 && $r['bancos']['INTEGRACAO']['status'] === 'OK' && $r['bancos']['DSHOW_PROD']['status'] === 'DOWN', '3 fotografia válida: OK / DOWN com a idade');
$ok($fr(str_repeat('b', 40))['coleta'] === 'release_divergente' && $fr(str_repeat('b', 40))['bancos']['INTEGRACAO']['status'] === 'UNKNOWN', '3 fotografia de outra release = release_divergente (não confiável)');
HealthAgregado::gravarAtomico($arq, $foto(['INTEGRACAO' => ['estado' => 'ok'], 'DSHOW_PROD' => ['estado' => 'ok']], $agora - 61));
$ok($fr()['coleta'] === 'vencida' && $fr()['idade_s'] === 61 && $fr()['bancos']['INTEGRACAO']['status'] === 'UNKNOWN', '3 coletor parado (61 s) = vencida: informativo marcado, nunca OK');
HealthAgregado::gravarAtomico($arq, $foto(['INTEGRACAO' => ['estado' => 'ok']], $agora + 30));
$ok($fr()['coleta'] === 'invalida', '3 fotografia "do futuro" (relógio adiantado > 2 s) = invalida');
file_put_contents($arq, '{quebrado'); chmod($arq, 0644);
$ok($fr()['coleta'] === 'invalida', '3 JSON quebrado = invalida');
HealthAgregado::gravarAtomico($arq, $foto(['INTEGRACAO' => ['estado' => 'ok'], 'DSHOW_PROD' => ['estado' => 'ok']], $agora)); chmod($arq, 0666);
$ok($fr()['coleta'] === 'permissao_insegura', '3 fotografia gravável por outros (0666) = permissao_insegura (não confiável)');
chmod($arq, 0644);
$antes = (string) file_get_contents($arq); $erro = null;
try { HealthAgregado::gravarAtomico($arq, ['x' => str_repeat('a', 9000)]); } catch (RuntimeException $e) { $erro = $e; }
$ok($erro !== null && file_get_contents($arq) === $antes && glob("$tmp/.foto-*") === [], '3 gravação recusada (> 8 KiB) não toca a fotografia anterior');
// coletor de verdade, só com portas LOCAIS (uma aberta, uma fechada) e config de teste inexistente (banco = failed)
$srv = stream_socket_server('tcp://127.0.0.1:0', $en, $es); $porta = (int) substr(strrchr(stream_socket_get_name($srv, false), ':'), 1);
$fechada = stream_socket_server('tcp://127.0.0.1:0', $en, $es); $pf = (int) substr(strrchr(stream_socket_get_name($fechada, false), ':'), 1); fclose($fechada);
$env = "HEALTH_FOTO_DIR=$tmp DB_INTEGRACAO_HOST=127.0.0.1 DB_INTEGRACAO_PORT=$porta DB_DSHOW_PROD_HOST=127.0.0.1 DB_DSHOW_PROD_PORT=$pf HEALTH_DASH_CONFIG=$tmp/sem-config.php";
$t0 = microtime(true); exec("$env " . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$raiz/scripts/health/coletor-health.php") . ' --uma-vez 2>&1', $saida, $rc); $dt = microtime(true) - $t0;
$rem = json_decode((string) @file_get_contents("$tmp/remote-v4.json"), true); $sam = json_decode((string) @file_get_contents("$tmp/samples-v4.json"), true);
$ok($rc === 0 && ($rem['bancos']['INTEGRACAO']['estado'] ?? '') === 'ok' && ($rem['bancos']['DSHOW_PROD']['estado'] ?? '') === 'falhou' && !isset($rem['bancos']['INTEGRACAO']['host']), '3 coletor: porta aberta = ok, fechada = falhou, sem host publicado · ' . implode(' ', $saida));
$ok(($sam['version'] ?? 0) === 4 && ($sam['samples']['database']['state'] ?? '') === 'failed' && isset($sam['samples']['disk']['usedPercent'], $sam['samples']['memory']['state']) && (fileperms("$tmp/samples-v4.json") & 0777) === 0644, '3 coletor: amostras v4 (banco sem config = failed, disco com uso, memória) em 0644');
$ok($dt < 3.0, '3 coletor --uma-vez termina rápido mesmo com sonda falhando (' . round($dt, 2) . ' s)');
// timeout por check = amostra INVÁLIDA (não renova o frescor) · OOM na janela = falha (SEGURAR) · swap só informativo · --medir
file_put_contents("$tmp/lento.php", "<?php final class DatabaseManager { public static function testConnection(string \$b): array { usleep(150000); return ['success' => true]; } }\n");
file_put_contents("$tmp/.oom-anterior", '-1');   // força "o contador de OOM subiu desde a coleta anterior"
$env2 = str_replace("HEALTH_DASH_CONFIG=$tmp/sem-config.php", "HEALTH_DASH_CONFIG=$tmp/lento.php", $env);
exec("$env2 " . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$raiz/scripts/health/coletor-health.php") . ' --uma-vez 2>&1', $s2, $rc2);
$sam2 = json_decode((string) @file_get_contents("$tmp/samples-v4.json"), true);
$ok(($sam2['samples']['database']['state'] ?? '') === 'timeout' && $sam2['samples']['database']['durationMs'] > 100, '4 banco que leva 150 ms (proposta 100) = amostra timeout (inválida)');
require_once $raiz . '/api/core/HealthOperacionalV4.php';
$av = HealthOperacionalV4::avaliar($sam2 + ['version' => 4], null, time());
$ok(in_array('database', $av['publication']['blocking'], true) && ($av['checks']['database']['state'] ?? '') === 'invalid' && isset($av['evaluatedAt']), '4 a v4 trata o timeout como inválido e BLOQUEIA (sem renovar o frescor); evaluatedAt publicado');
$ok(($sam2['samples']['memory']['oomNaJanela'] ?? null) === true && ($sam2['samples']['memory']['state'] ?? '') === 'failed', '4 OOM na janela de observação = memória failed (SEGURAR)');
$ok(array_key_exists('swapPercent', $sam2['samples']['memory'] ?? []) && in_array($sam2['samples']['memory']['state'] ?? '', ['failed'], true), '4 swap aparece só como informação (não decide)');
exec("$env " . escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$raiz/scripts/health/coletor-health.php") . ' --medir 5 2>&1', $med, $rc3);
$linhaDb = implode("\n", array_filter($med, static fn ($l) => str_starts_with($l, 'database')));
$ok($rc3 === 0 && preg_match('/^database\s+5\s+[0-9.]+\s+[0-9.]+\s+100\s+(\d+)$/m', $linhaDb, $mm) === 1 && (int) $mm[1] >= 100 && str_contains(implode("\n", $med), 'timeouts.json sugerido:'), '4 --medir: p95 por check e timeout sugerido = máx(proposta, 3×p95) · ' . $linhaDb);
// LIMITE GLOBAL por ciclo (4 s): check travado (20 s) → ciclo morto em ~4 s, amostras timeout, remota NÃO renovada, pulo registrado
$col = escapeshellarg(PHP_BINARY) . ' ' . escapeshellarg("$raiz/scripts/health/coletor-health.php");
file_put_contents("$tmp/rapido.php", "<?php final class DatabaseManager { public static function testConnection(string \$b): array { return ['success' => true]; } }\n");
file_put_contents("$tmp/travado.php", "<?php final class DatabaseManager { public static function testConnection(string \$b): array { sleep(20); return ['success' => true]; } }\n");
$envR = str_replace("HEALTH_DASH_CONFIG=$tmp/sem-config.php", "HEALTH_DASH_CONFIG=$tmp/rapido.php", $env);
$envT = str_replace("HEALTH_DASH_CONFIG=$tmp/sem-config.php", "HEALTH_DASH_CONFIG=$tmp/travado.php", $env);
if (is_file("$tmp/.oom-anterior")) { rename("$tmp/.oom-anterior", "$tmp/.oom-anterior.forcado"); } exec("$envR $col --uma-vez 2>&1");
$remotaBoa = json_decode((string) file_get_contents("$tmp/remote-v4.json"), true)['gerado_em'];
$t0 = microtime(true); exec("$envT $col --uma-vez 2>&1", $sT); $dtT = microtime(true) - $t0;
$samT = json_decode((string) file_get_contents("$tmp/samples-v4.json"), true);
$ok($dtT < 6.0 && ($samT['samples']['database']['state'] ?? '') === 'timeout' && ($samT['samples']['redis']['state'] ?? '') === 'timeout', 'limite global: check travado (20 s) → ciclo morto em ' . round($dtT, 1) . ' s, amostras timeout (inválidas)');
$ok(json_decode((string) file_get_contents("$tmp/remote-v4.json"), true)['gerado_em'] === $remotaBoa && str_contains((string) @file_get_contents("$tmp/.ciclos-pulados"), 'ciclo_excedeu'), 'limite global: a fotografia remota NÃO é renovada sem leitura nova bem-sucedida; o pulo é registrado');
// check travado em LAÇO: aos 16 s a v4 tem de estar bloqueando (nunca "fresca" por mais de 15 s)
exec("$envR $col --uma-vez 2>&1"); $remotaBoa = json_decode((string) file_get_contents("$tmp/remote-v4.json"), true)['gerado_em'];
$bg = proc_open("exec env $envT $col --laco 22", [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pb);
sleep(1);
exec("$envR $col --uma-vez 2>&1", $sDup, $rcDup);
$ok($rcDup === 0 && str_contains((string) @file_get_contents("$tmp/.ciclos-pulados"), 'coletor_anterior_em_execucao'), 'ciclo não sobrepõe ciclo: um segundo coletor é pulado e registrado');
sleep(15);
$samL = json_decode((string) file_get_contents("$tmp/samples-v4.json"), true);
$avL = HealthOperacionalV4::avaliar($samL + ['version' => 4], null, time());
$remL = json_decode((string) file_get_contents("$tmp/remote-v4.json"), true);
$ok(!$avL['publication']['allowed'] && in_array('database', $avL['publication']['blocking'], true) && $remL['gerado_em'] === $remotaBoa, 'check travado em laço: aos 16 s a v4 BLOQUEIA e a remota segue com a leitura antiga (não renovada)');
proc_terminate($bg, 9); proc_close($bg);
fclose($srv);
exec('mv ' . escapeshellarg($tmp) . ' ' . escapeshellarg('/backup/esquerda/' . date('Ymd-His') . '-teste-health-r1-' . getmypid()));   // nada de rm (regra 27/11): vai para o backup
// estático: health.php
$h = (string) file_get_contents($raiz . '/api/health.php');
$ok(!preg_match("/\\\$health\\['status'\\]\\s*=\\s*'/", $h) && substr_count($h, '$piorar(') >= 8, '2 health.php: nenhuma atribuição direta ao agregado; tudo por piorar()');
$ok(!str_contains($h, 'fsockopen') && !str_contains($h, '->info(') && str_contains($h, '->ping()') && !str_contains($h, "'message' => \$e->getMessage()"), '3 health.php: sem sonda síncrona, Redis por PING (sem INFO), sem mensagem de erro publicada');
$ok(str_contains($h, 'HealthAgregado::fotografiaRemota(') && str_contains($h, "\$foto['coleta']") && str_contains($h, "\$piorar('DEGRADED')"), '3 health.php: remota só pela fotografia, com o motivo da coleta e no máximo DEGRADED');
if ($f) { echo "[ERRO] teste-health-r1:\n - " . implode("\n - ", $f) . "\n"; exit(1); }
echo "[OK]   teste-health-r1: $n verificações (92% bloqueio pelo valor bruto, agregado monotônico, crítico ausente = falha, fotografia atômica/restrita/release/idade, coletor fora da requisição, memória 85/95, orçamento ≤ 120 ms)\n";
