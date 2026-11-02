<?php
// pipedrive-backfill-webhook-events.php — one-shot do #65 (CLI)
// @version 1.0.0
// @created 2026-07-29
// @app Pipedrive Analytics
//
// A correcao do #65 fecha o ciclo dos eventos DAQUI EM DIANTE. Este script fecha o
// passivo: os eventos que ficaram presos em 'received' porque ninguem nunca gravava
// 'processed' — nao porque o trabalho tenha falhado.
//
// REGRA (conservadora, verificavel linha a linha): um evento so e fechado se existir um
// job do MESMO alvo (entity+external_id) com status 'done' e `processed_at >= received_at`
// do evento — ou seja, um re-fetch comprovadamente posterior ao evento. `processed_at` do
// evento recebe o instante DESSE job, nao NOW(): o que interessa registrar e quando o
// trabalho aconteceu, nao quando a migracao rodou.
//
// Uso:
//   php scripts/pipedrive-backfill-webhook-events.php            # seco (nao grava)
//   php scripts/pipedrive-backfill-webhook-events.php --apply    # grava
declare(strict_types=1);

if (PHP_SAPI !== 'cli') { http_response_code(403); exit("CLI apenas\n"); }

$base = dirname(__DIR__);
require_once $base . '/config/db_connection.php';

$opts  = getopt('', ['apply']);
$apply = isset($opts['apply']);
$pdo   = getConnection('PIPE_DSHOW');
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// Alvo: evento em aberto COM job concluido posterior. O LEFT JOIN pega o job elegivel
// mais antigo (o primeiro re-fetch que cobriu o evento).
$sqlAlvo = "
    SELECT e.id,
           e.event_object,
           e.object_id,
           e.received_at,
           MIN(j.processed_at) AS coberto_em
      FROM pipe_webhook_events e
      JOIN pipe_sync_jobs j
        ON j.entity = e.event_object
       AND j.external_id = e.object_id
       AND j.status = 'done'
       AND j.processed_at >= e.received_at
     WHERE e.status = 'received'
     GROUP BY e.id, e.event_object, e.object_id, e.received_at";

$alvos = $pdo->query($sqlAlvo)->fetchAll();
$emAberto = (int)$pdo->query("SELECT COUNT(*) FROM pipe_webhook_events WHERE status='received'")->fetchColumn();

printf("eventos em aberto: %d\n", $emAberto);
printf("com prova de cobertura (job 'done' posterior): %d\n", count($alvos));
printf("SEM prova (ficam como estao): %d\n", $emAberto - count($alvos));

if (!$alvos) { echo "nada a fazer.\n"; exit(0); }

// Por entidade, para conferencia visual antes de aplicar.
$porObj = [];
foreach ($alvos as $a) { $porObj[$a['event_object']] = ($porObj[$a['event_object']] ?? 0) + 1; }
ksort($porObj);
foreach ($porObj as $obj => $n) { printf("  %-14s %d\n", $obj, $n); }

if (!$apply) {
    echo "\nSECO — nada gravado. Rode com --apply para aplicar.\n";
    exit(0);
}

// Backup das linhas afetadas ANTES de escrever (PNR).
$dir = '/backup/pipedrive-backfill-webhook-events-' . date('Y-m-d');
if (!is_dir($dir)) { mkdir($dir, 0750, true); }
$arq = $dir . '/pipe_webhook_events-antes.csv';
$fh  = fopen($arq, 'w');
fputcsv($fh, ['id', 'status_antes', 'processed_at_antes', 'event_object', 'object_id', 'received_at']);
$antes = $pdo->prepare("SELECT status, processed_at FROM pipe_webhook_events WHERE id = :id");
foreach ($alvos as $a) {
    $antes->execute([':id' => $a['id']]);
    $r = $antes->fetch();
    fputcsv($fh, [$a['id'], $r['status'], $r['processed_at'], $a['event_object'], $a['object_id'], $a['received_at']]);
}
fclose($fh);
printf("\nbackup das linhas afetadas: %s\n", $arq);

$upd = $pdo->prepare(
    "UPDATE pipe_webhook_events
        SET status = 'processed', processed_at = :em
      WHERE id = :id AND status = 'received'"
);
$n = 0;
$pdo->beginTransaction();
try {
    foreach ($alvos as $a) {
        $upd->execute([':em' => $a['coberto_em'], ':id' => $a['id']]);
        $n += $upd->rowCount();
    }
    $pdo->commit();
} catch (\Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, 'FALHOU, nada gravado: ' . $e->getMessage() . "\n");
    exit(1);
}

printf("fechados: %d\n", $n);
echo "\n== depois ==\n";
foreach ($pdo->query("SELECT status, COUNT(*) c FROM pipe_webhook_events GROUP BY status") as $r) {
    printf("  %-10s %d\n", $r['status'], $r['c']);
}
