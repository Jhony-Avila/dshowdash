<?php
// pipedrive-sync.php - rotina de sincronizacao do Pipedrive (CLI)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Modos:
//   --mode=incremental  delta por marca-d'agua (updated_since) - a cada 15 min
//   --mode=full         carga/reconciliacao completa - janela de baixo uso
//   --mode=reference    so funis/etapas/usuarios (rapido, barato)
//   --mode=drain-queue  processa a fila de webhooks (pipe_sync_jobs) - a cada 1 min
//
// Uso no cron (ver /etc/cron.d/pipedrive):
//   */15 * * * * www-data /usr/bin/php .../scripts/pipedrive-sync.php --mode=incremental
//
// Trava por modo via flock em storage/locks (dono www-data; NAO /tmp): uma execucao
// lenta nunca se sobrepoe a proxima. Espelha scripts/datatables-monitor.php.
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI apenas\n");
}

require_once __DIR__ . '/../config/db_connection.php';
require_once __DIR__ . '/../api/pipedrive/lib/PipeCrypto.php';
require_once __DIR__ . '/../api/pipedrive/lib/PipedriveClient.php';
require_once __DIR__ . '/../api/pipedrive/repositories/AccountRepository.php';
require_once __DIR__ . '/../api/pipedrive/repositories/SyncRepository.php';
require_once __DIR__ . '/../api/pipedrive/repositories/QueueRepository.php';
require_once __DIR__ . '/../api/pipedrive/repositories/MetricsRepository.php';
require_once __DIR__ . '/../api/pipedrive/services/SyncService.php';
require_once __DIR__ . '/../api/pipedrive/services/QueueService.php';
require_once __DIR__ . '/../api/pipedrive/services/ReconcileService.php';

$opts    = getopt('', ['mode::', 'verbose', 'limit::', 'strategy::', 'dry-run']);
$mode    = $opts['mode'] ?? 'incremental';
$verbose = isset($opts['verbose']);
$valid   = ['incremental', 'full', 'reference', 'drain-queue', 'deal-products', 'metrics', 'reconcile'];
if (!in_array($mode, $valid, true)) {
    fwrite(STDERR, "modo invalido: {$mode} (use " . implode('|', $valid) . ")\n");
    exit(2);
}

$logLine = static function (string $m): void {
    fwrite(STDOUT, '[' . date('Y-m-d H:i:s') . "] {$m}\n");
};

// ── Trava ───────────────────────────────────────────────────────
$lockDir = __DIR__ . '/../storage/locks';
if (!is_dir($lockDir)) { @mkdir($lockDir, 0775, true); @chmod($lockDir, 0775); }
$lockFile = $lockDir . "/pipedrive-{$mode}.lock";
$lock = @fopen($lockFile, 'c');
if ($lock !== false) { @chmod($lockFile, 0664); }
if ($lock === false) {
    $logLine("FATAL: nao foi possivel abrir a trava {$lockFile} - verifique dono/permissao");
    exit(1);
}
if (!flock($lock, LOCK_EX | LOCK_NB)) {
    $logLine("modo={$mode} ja em execucao - saindo");
    fclose($lock);
    exit(0);
}

// ── Execucao ────────────────────────────────────────────────────
$exit = 0;
try {
    $pdo = getConnection('PIPE_DSHOW');
    $svc = new PipeSyncService($pdo);

    $t0 = microtime(true);
    if ($mode === 'drain-queue') {
        $limit = isset($opts['limit']) && is_numeric($opts['limit']) ? (int) $opts['limit'] : 200;
        $q = new PipeQueueService($pdo);
        $dr = $q->drainQueue(max(1, min($limit, 500)));
        $ms = (int) round((microtime(true) - $t0) * 1000);
        if (($dr['error'] ?? '') === 'SEM_CREDENCIAL') {
            $logLine('modo=drain-queue: SEM CREDENCIAL ativa - nada a fazer');
            $exit = 0;
        } else {
            $logLine(sprintf('modo=drain-queue %dms | claimed=%d done=%d deleted=%d retry=%d dead=%d',
                $ms, $dr['claimed'], $dr['done'], $dr['deleted'], $dr['retry'], $dr['dead']));
            $exit = 0; // drenagem parcial nao e erro operacional (jobs reagendam)
        }
    } elseif ($mode === 'deal-products') {
        $sp = ['run_type' => 'cron'];
        if (isset($opts['limit']) && is_numeric($opts['limit'])) { $sp['maxDeals'] = (int) $opts['limit']; }
        $dp = $svc->syncDealProducts($sp);
        $ms = (int) round((microtime(true) - $t0) * 1000);
        if (($dp['error'] ?? '') === 'SEM_CREDENCIAL') {
            $logLine('modo=deal-products: SEM CREDENCIAL ativa - nada a fazer');
            $exit = 0;
        } else {
            $s = $dp['stats'] ?? [];
            $logLine(sprintf('modo=deal-products %dms | deals=%d proc=%d itens=%d api=%d err=%d token_cost=%d',
                $ms, $dp['total_deals'] ?? 0, $s['processed'] ?? 0, $s['items'] ?? 0,
                $s['api_calls'] ?? 0, $s['errors'] ?? 0, $s['token_cost'] ?? 0));
            $exit = ($dp['ok'] ?? false) ? 0 : 1;
        }
    } elseif ($mode === 'metrics') {
        $mr = $svc->computeMetrics();
        $ms = (int) round((microtime(true) - $t0) * 1000);
        $logLine(sprintf('modo=metrics %dms | ok=%s daily_rows=%d hourly_rows=%d %s',
            $ms, ($mr['ok'] ?? false) ? 'sim' : 'NAO',
            $mr['daily_rows'] ?? 0, $mr['hourly_rows'] ?? 0, ($mr['error'] ?? null) ? ('ERR=' . $mr['error']) : ''));
        $exit = ($mr['ok'] ?? false) ? 0 : 1;
    } elseif ($mode === 'reconcile') {
        $ro = ['run_type' => 'cron'];
        if (($opts['strategy'] ?? '') === 'presence') { $ro['strategy'] = 'presence'; }
        if (isset($opts['dry-run'])) { $ro['dry_run'] = true; }
        $rec = new PipeReconcileService($pdo);
        $rr = $rec->reconcile($ro);
        $ms = (int) round((microtime(true) - $t0) * 1000);
        if (($rr['error'] ?? '') === 'SEM_CREDENCIAL') {
            $logLine('modo=reconcile: SEM CREDENCIAL ativa - nada a fazer');
            $exit = 0;
        } else {
            if ($verbose) {
                foreach (($rr['entities'] ?? []) as $ent => $e) {
                    $logLine(sprintf('  %-14s %s marcados=%d %s', $ent, $e['strategy'] ?? '',
                        $e['marked_deleted'] ?? 0, isset($e['incomplete']) ? ('INCOMPLETO:' . ($e['reason'] ?? '')) : ''));
                }
            }
            $logLine(sprintf('modo=reconcile %dms | estrategia=%s dry_run=%s marcados_deletados=%d',
                $ms, $rr['strategy'] ?? '?', ($rr['dry_run'] ?? false) ? 'sim' : 'nao', $rr['total_marked_deleted'] ?? 0));
            $exit = ($rr['ok'] ?? false) ? 0 : 1;
        }
    } else {
        if ($mode === 'reference') {
            $r = $svc->syncReference(['run_type' => 'cron']);
        } else {
            $r = $svc->run($mode, ['run_type' => 'cron']);
        }
        $ms = (int) round((microtime(true) - $t0) * 1000);

        if (!($r['ok'] ?? false) && ($r['error'] ?? '') === 'SEM_CREDENCIAL') {
            $logLine("modo={$mode}: SEM CREDENCIAL ativa - nada a fazer");
            $exit = 0; // nao e erro operacional
        } else {
            $ents = $r['entities'] ?? [];
            $tot = ['processed' => 0, 'created' => 0, 'updated' => 0, 'errors' => 0, 'token_cost' => 0];
            foreach ($ents as $name => $e) {
                $s = $e['stats'] ?? [];
                foreach (['processed', 'created', 'updated', 'errors', 'token_cost'] as $k) {
                    $tot[$k] += (int) ($s[$k] ?? 0);
                }
                if ($verbose) {
                    $logLine(sprintf('  %-10s proc=%d cre=%d upd=%d err=%d %s',
                        $name, $s['processed'] ?? 0, $s['created'] ?? 0, $s['updated'] ?? 0,
                        $s['errors'] ?? 0, ($e['error'] ?? null) ? ('ERR=' . $e['error']) : ''));
                }
            }
            $logLine(sprintf('modo=%s ok=%s %dms | proc=%d cre=%d upd=%d err=%d token_cost=%d',
                $mode, ($r['ok'] ?? false) ? 'sim' : 'NAO', $ms,
                $tot['processed'], $tot['created'], $tot['updated'], $tot['errors'], $tot['token_cost']));
            $exit = ($r['ok'] ?? false) ? 0 : 1;
        }
    }
} catch (\Throwable $e) {
    $logLine('FATAL: ' . $e->getMessage());
    error_log('[pipedrive-sync] ' . $e->getMessage());
    $exit = 1;
} finally {
    flock($lock, LOCK_UN);
    fclose($lock);
}

exit($exit);
