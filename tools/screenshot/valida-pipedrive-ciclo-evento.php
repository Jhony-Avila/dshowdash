<?php
// Prova do #65/#66: o ciclo de vida do webhook_event fecha, e fecha pelo criterio certo.
//
// @version 1.0.0
// @created 2026-07-29
// @app Pipedrive Analytics
//
// POR QUE SANDBOX: em producao a fila esta 100% saudavel (0 pendente, 0 morto) e os
// eventos chegam do Pipedrive, nao de mim. Os casos que decidem a correcao — evento que
// chegou DEPOIS do re-fetch, evento de outro alvo, evento ja em 'error', N eventos
// colapsando num job so — nao aparecem sozinhos. Sem sombra, esta prova so confirmaria
// o caso trivial.
//
// COMO: CREATE TEMPORARY TABLE sombreia pipe_webhook_events dentro desta conexao. O
// repositorio real opera sobre ela sem saber; nenhuma outra conexao (nem o cron de 1 min)
// enxerga; ao fechar o script a tabela evapora. Guarda no fim confere que a tabela real
// nao foi tocada. Nenhuma chamada de API — o alvo aqui e a REGRA, nao o re-fetch.
//
// Uso: php tools/screenshot/valida-pipedrive-ciclo-evento.php
declare(strict_types=1);

$base = dirname(__DIR__, 2);
require_once $base . '/config/db_connection.php';
require_once $base . '/api/pipedrive/repositories/QueueRepository.php';

$env = [];
foreach (file($base . '/.env') as $l) {
    if (preg_match('/^([A-Z0-9_]+)=(.*)$/', trim($l), $m)) { $env[$m[1]] = $m[2]; }
}
// pipe_app NAO tem CREATE TEMPORARY TABLES — credencial administrativa so para a sombra.
$conectar = static function () use ($env): PDO {
    return new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $env['DB_PIPE_DSHOW_HOST'], $env['DB_PIPE_DSHOW_PORT'], $env['DB_PIPE_DSHOW_NAME']),
        $env['DB_DSHOWDASH_USER'], $env['DB_DSHOWDASH_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false,
         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
};
$pdo = $conectar();

$falhas = 0;
$checks = 0;
$ok = static function (bool $cond, string $msg) use (&$falhas, &$checks): void {
    $checks++;
    if ($cond) { echo "  [ok] {$msg}\n"; return; }
    $falhas++;
    echo "  [XX] {$msg}\n";
};

// Estado real, para a guarda final (lido ANTES de qualquer sombra existir).
$realAntes = $pdo->query('SELECT status, COUNT(*) c FROM pipe_webhook_events GROUP BY status')->fetchAll();
$jobsAntes = $pdo->query('SELECT status, COUNT(*) c FROM pipe_sync_jobs GROUP BY status')->fetchAll();

// ── Sombra ──────────────────────────────────────────────────────────────────────
$ddl = $pdo->query('SHOW CREATE TABLE pipe_webhook_events')->fetch()['Create Table'];
$pdo->exec(preg_replace('/^CREATE TABLE/', 'CREATE TEMPORARY TABLE', $ddl, 1));
$naSombra = (int)$pdo->query('SELECT COUNT(*) c FROM pipe_webhook_events')->fetch()['c'];
$ok($naSombra === 0, "sombra ativa e vazia (a real tem dados; a sombra, {$naSombra})");

$repo = new PipeQueueRepository($pdo);

// Relogio do banco, para montar instantes coerentes com `received_at`.
$agora = $repo->agora();
$t = static function (string $expr) use ($pdo): string {
    return (string)$pdo->query("SELECT {$expr}")->fetchColumn();
};
$tMenos10 = $t('NOW() - INTERVAL 10 MINUTE');
$tMenos5  = $t('NOW() - INTERVAL 5 MINUTE');
$tMais5   = $t('NOW() + INTERVAL 5 MINUTE');

$semear = static function (PDO $pdo, string $obj, string $oid, string $recebidoEm, string $status, string $dk): int {
    // Placeholder nomeado NAO pode repetir com prepares nativos (EMULATE_PREPARES=false):
    // event_time e received_at levam o mesmo valor por parametros distintos.
    $st = $pdo->prepare(
        "INSERT INTO pipe_webhook_events
           (event_action, event_object, object_id, event_time, status, dedup_key, received_at)
         VALUES ('updated', :o, :x, :et, :s, :dk, :rt)"
    );
    $st->execute([':o' => $obj, ':x' => $oid, ':et' => $recebidoEm, ':s' => $status, ':dk' => $dk, ':rt' => $recebidoEm]);
    return (int)$pdo->lastInsertId();
};
$statusDe = static function (PDO $pdo, int $id): array {
    $st = $pdo->prepare('SELECT status, processed_at FROM pipe_webhook_events WHERE id = :id');
    $st->execute([':id' => $id]);
    return $st->fetch();
};

// ── Cenario ─────────────────────────────────────────────────────────────────────
// Alvo A (deal#111): 3 eventos antigos — o coalescing manda os 3 fecharem com UM job.
$a1 = $semear($pdo, 'deal', '111', $tMenos10, 'received', 'dk-a1');
$a2 = $semear($pdo, 'deal', '111', $tMenos10, 'received', 'dk-a2');
$a3 = $semear($pdo, 'deal', '111', $tMenos5,  'received', 'dk-a3');
// Alvo A, mas chegou DEPOIS da fronteira: pode refletir estado mais novo que o buscado.
$aDepois = $semear($pdo, 'deal', '111', $tMais5, 'received', 'dk-a-depois');
// Alvo A ja em 'error': terminal, nao pode ser reescrito.
$aErro = $semear($pdo, 'deal', '111', $tMenos10, 'error', 'dk-a-erro');
// Alvo B (deal#222): outro alvo, o job de A nao pode encostar nele.
$b1 = $semear($pdo, 'deal', '222', $tMenos10, 'received', 'dk-b1');
// Mesmo id, objeto diferente (activity#111): nao pode ser confundido com deal#111.
$c1 = $semear($pdo, 'activity', '111', $tMenos10, 'received', 'dk-c1');

echo "\n=== fechamento por um job de deal#111 (fronteira = agora) ===\n";
$fechados = $repo->markWebhookEventsProcessed('deal', '111', $agora);

$ok($fechados === 3, "fechou os 3 eventos do alvo, com UMA chamada — o coalescing e isso  ({$fechados})");
foreach ([$a1, $a2, $a3] as $i => $id) {
    $r = $statusDe($pdo, $id);
    $ok($r['status'] === 'processed', 'evento anterior a fronteira #' . ($i + 1) . " virou processed  ({$r['status']})");
    $ok($r['processed_at'] !== null, 'evento anterior a fronteira #' . ($i + 1) . ' ganhou processed_at');
}

$r = $statusDe($pdo, $aDepois);
$ok($r['status'] === 'received', "evento POSTERIOR a fronteira continua em aberto — e o caso que protege contra fechar o que o re-fetch nao viu  ({$r['status']})");

$r = $statusDe($pdo, $aErro);
$ok($r['status'] === 'error', "evento ja em 'error' nao foi reescrito  ({$r['status']})");

$r = $statusDe($pdo, $b1);
$ok($r['status'] === 'received', "outro alvo (deal#222) intocado  ({$r['status']})");

$r = $statusDe($pdo, $c1);
$ok($r['status'] === 'received', "mesmo id em outro objeto (activity#111) intocado — event_object faz parte da chave  ({$r['status']})");

echo "\n=== idempotencia ===\n";
$denovo = $repo->markWebhookEventsProcessed('deal', '111', $agora);
$ok($denovo === 0, "rodar de novo nao fecha nada e nao reescreve processed_at  ({$denovo})");

echo "\n=== o evento tardio fecha no job seguinte ===\n";
$fechados2 = $repo->markWebhookEventsProcessed('deal', '111', $t('NOW() + INTERVAL 10 MINUTE'));
$ok($fechados2 === 1, "com a fronteira do proximo job, o evento tardio fecha  ({$fechados2})");
$r = $statusDe($pdo, $aDepois);
$ok($r['status'] === 'processed', "evento tardio agora esta fechado  ({$r['status']})");

// ── Ponta a ponta: a DRENAGEM fecha o evento? ───────────────────────────────────
// As checagens acima provam a REGRA. Se eu tivesse esquecido de chamar
// markWebhookEventsProcessed() dentro do drainQueue, todas elas passariam do mesmo
// jeito — o que falta provar e a FIACAO. Aqui a fila tambem entra na sombra e um job
// sintetico aponta para um deal REAL: o re-fetch e uma leitura de verdade e o upsert
// cai no pipe_deals real (idempotente — e o mesmo que o cron ja grava a cada minuto).
echo "\n=== ponta a ponta: drenagem fecha o evento ===\n";
require_once $base . '/api/pipedrive/lib/PipeCrypto.php';
require_once $base . '/api/pipedrive/lib/PipedriveClient.php';
require_once $base . '/api/pipedrive/repositories/AccountRepository.php';
require_once $base . '/api/pipedrive/repositories/SyncRepository.php';
require_once $base . '/api/pipedrive/repositories/MetricsRepository.php';
require_once $base . '/api/pipedrive/services/QueueService.php';

$dealReal = $pdo->query('SELECT pipedrive_id FROM pipe_deals WHERE is_deleted = 0 ORDER BY update_time DESC LIMIT 1')->fetchColumn();
if ($dealReal === false) {
    echo "  (sem deal local para usar de alvo — fase pulada)\n";
} else {
    $ddlJobs = $pdo->query('SHOW CREATE TABLE pipe_sync_jobs')->fetch()['Create Table'];
    $pdo->exec(preg_replace('/^CREATE TABLE/', 'CREATE TEMPORARY TABLE', $ddlJobs, 1));
    $ok((int)$pdo->query('SELECT COUNT(*) c FROM pipe_sync_jobs')->fetch()['c'] === 0, 'sombra da fila ativa e vazia');

    $pdo->prepare(
        "INSERT INTO pipe_sync_jobs (job_type, entity, external_id, priority, status, attempts, next_attempt_at, created_at)
         VALUES ('webhook', 'deal', :x, 1, 'pending', 0, NOW(), NOW())"
    )->execute([':x' => (string)$dealReal]);

    $evE2E = $semear($pdo, 'deal', (string)$dealReal, $t('NOW() - INTERVAL 1 MINUTE'), 'received', 'dk-e2e');

    $svc = new PipeQueueService($pdo);
    $res = $svc->drainQueue(10);

    $ok(($res['ok'] ?? false) === true, 'drenagem rodou  ' . json_encode(['claimed' => $res['claimed'] ?? null, 'done' => $res['done'] ?? null, 'events_closed' => $res['events_closed'] ?? null]));
    $ok((int)($res['claimed'] ?? 0) === 1, 'reivindicou o job sintetico  (' . ($res['claimed'] ?? 0) . ')');
    $ok((int)($res['done'] ?? 0) + (int)($res['deleted'] ?? 0) === 1, 'concluiu o job  (done=' . ($res['done'] ?? 0) . ' deleted=' . ($res['deleted'] ?? 0) . ')');
    $ok((int)($res['events_closed'] ?? 0) === 1, 'a DRENAGEM fechou o evento — a fiacao existe  (' . ($res['events_closed'] ?? 0) . ')');
    $r = $statusDe($pdo, $evE2E);
    $ok($r['status'] === 'processed', "evento do alvo real ficou 'processed'  ({$r['status']})");
}

// ── Guarda: producao intocada ───────────────────────────────────────────────────
echo "\n=== guarda ===\n";
$pdo2 = $conectar();
$jobsDepois = $pdo2->query('SELECT status, COUNT(*) c FROM pipe_sync_jobs GROUP BY status')->fetchAll();
$ok(json_encode($jobsAntes) === json_encode($jobsDepois),
    'fila real inalterada: ' . json_encode(array_column($jobsDepois, 'c', 'status')) . ' — nenhum job sintetico vazou');
$realDepois = $pdo2->query("SELECT status, COUNT(*) c FROM pipe_webhook_events GROUP BY status")->fetchAll();
$ok(json_encode($realAntes) === json_encode($realDepois),
    'tabela real inalterada: ' . json_encode(array_column($realDepois, 'c', 'status')));

echo "\n" . ($falhas === 0
    ? "PASSOU — {$checks} checagens, 0 falha(s)\n"
    : "REPROVOU — {$falhas} falha(s) em {$checks} checagens\n");
exit($falhas === 0 ? 0 : 1);
