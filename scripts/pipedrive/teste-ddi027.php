<?php
declare(strict_types=1);
// scripts/pipedrive/teste-ddi027.php — DDI-027 (GPT DATA, 28/11, VINHO): a marca-d'água só avança até o PERSISTIDO; rodada com erro individual ou
// limitada = "partial" (nunca "completed"); full sync só declarada com cobertura integral e zero erro. MySQL de TESTE zz_… + servidor FALSO local.
// Falha de gravação simulada por trigger. Uso: php teste-ddi027.php <zz_banco> [--raiz <árvore>]
$db = $argv[1] ?? ''; if (preg_match('/^zz_[a-z0-9_]{1,40}\z/', $db) !== 1) { fwrite(STDERR, "banco zz_… obrigatório\n"); exit(2); }
$raiz = (($i = array_search('--raiz', $argv, true)) !== false) ? $argv[$i + 1] : dirname(__DIR__, 2);
foreach (['lib/PipedriveClient.php', 'repositories/SyncRepository.php', 'repositories/AccountRepository.php', 'services/SyncService.php'] as $f) require_once "$raiz/api/pipedrive/$f";
$pdo = new PDO("mysql:unix_socket=/run/mysqld/mysqld.sock;dbname=$db;charset=utf8mb4", 'root', '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
foreach (['pipe_deals', 'pipe_sync_runs', 'pipe_sync_cursors'] as $t) { $pdo->exec("DROP TABLE IF EXISTS $t"); $pdo->exec("CREATE TABLE $t LIKE ATRWEB_VAL_PIPE_8121.$t"); }
$pdo->exec("CREATE TRIGGER zz_falha_deal BEFORE INSERT ON pipe_deals FOR EACH ROW BEGIN IF NEW.pipedrive_id = @falhar THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'falha simulada'; END IF; END");
$ok = 0; $falhas = 0; $c = function (string $n, bool $v) use (&$ok, &$falhas): void { if ($v) $ok++; else { $falhas++; echo "FALHOU: $n\n"; } };
$porta = 19000 + random_int(0, 999); $srv = proc_open([PHP_BINARY, '-S', "127.0.0.1:$porta", __DIR__ . '/teste-ddi036-037-roteador.php'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pp); usleep(400000);
$svc = new PipeSyncService($pdo); $cli = new PipedriveClient('token-ficticio', "http://127.0.0.1:$porta", 5);
$roda = function (string $modo, ?int $falhar, array $opts = []) use ($svc, $cli, $pdo) {
    $pdo->exec('DELETE FROM pipe_deals'); $pdo->exec('DELETE FROM pipe_sync_cursors'); $pdo->exec('DELETE FROM pipe_sync_runs');
    $pdo->exec('SET @falhar = ' . ($falhar === null ? 'NULL' : (int) $falhar));
    $r = (fn () => $this->syncDeals($cli, $modo, null, $opts))->call($svc);
    return [$r, $pdo->query("SELECT watermark_update_time FROM pipe_sync_cursors WHERE entity = 'deals'")->fetchColumn() ?: null,
            $pdo->query("SELECT CONCAT(status, '/', errors) FROM pipe_sync_runs ORDER BY id DESC LIMIT 1")->fetchColumn(),
            $pdo->query("SELECT last_full_sync_at IS NOT NULL FROM pipe_sync_cursors WHERE entity = 'deals'")->fetchColumn(),
            (int) $pdo->query('SELECT COUNT(*) FROM pipe_deals')->fetchColumn()];
};
$t = fn (int $m) => sprintf('2026-11-28 10:%02d:00', $m);
[$r, $wm, $st, $full, $n] = $roda('full', null);
$c('sem falha: completed/0, marca = 10:05, full sync declarada', $st === 'completed/0' && $wm === $t(5) && (int) $full === 1 && $n === 5);
[$r, $wm, $st, $full, $n] = $roda('full', 3);
$c('falha NO MEIO (id 3): partial, marca PARA em 10:03 (o 3 é reprocessado), sem full sync', $st === 'partial/1' && $wm === $t(3) && !(int) $full && $n === 4);
[$r, $wm, $st] = $roda('incremental', 1);
$c('falha NO INÍCIO (id 1): partial, marca = 10:01', $st === 'partial/1' && $wm === $t(1));
[$r, $wm, $st] = $roda('incremental', 5);
$c('falha NO FIM (id 5): partial, marca = 10:04 (o último gravado; o 5 volta)', $st === 'partial/1' && $wm === $t(4));
[$r, $wm, $st, $full, $n] = $roda('full', null, ['maxPages' => 1]);
$c('rodada LIMITADA (teto 1 página): partial, nunca completed nem full sync; marca até o gravado (ASC)', $st === 'partial/0' && !(int) $full && $wm === $t(3) && $n === 3);
touch('/tmp/ddi027-semdata');
[$r, $wm, $st] = $roda('incremental', 6);
$c('falha de item SEM update_time: a marca NÃO avança', $wm === null && $st === 'partial/1');
unlink('/tmp/ddi027-semdata');
[$r, $wm, $st] = $roda('incremental', null); [$r2, $wm2, $st2] = $roda('incremental', null);
$c('reexecução idempotente (mesma marca, completed)', $wm === $wm2 && $st2 === 'completed/0');
$h = file_get_contents("$raiz/api/pipedrive/repositories/HealthRepository.php");
$c("HealthRepository intocado: saudável só 'completed' com 0 erros", str_contains($h, "\$ok = \$status === 'completed' && \$errors === 0;"));
proc_terminate($srv);
echo "teste-ddi027: $ok ok, $falhas falha(s)\n"; exit($falhas === 0 ? 0 : 1);
