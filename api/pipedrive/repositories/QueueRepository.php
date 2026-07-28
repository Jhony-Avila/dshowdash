<?php
// Pipedrive / QueueRepository - persistencia do ingest orientado a eventos
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Duas tabelas:
//   pipe_webhook_events  -> log/dedup de entregas do Pipedrive (auditoria)
//   pipe_sync_jobs       -> fila de trabalho (re-fetch + upsert), backoff, dead-letter
//   pipe_sync_errors     -> registro de falhas definitivas (dead)
//
// Semantica (doc 03 §3/§5): o webhook_event e um LOG de recepcao (received/duplicate/
// error). O trabalho de aplicar o dado vive no job (pending->running->done|error|dead).
// O job NAO confia no payload: ele apenas dispara um re-fetch da entidade na API
// (fonte da verdade), o que torna ordem-fora e reentrega inofensivas.
declare(strict_types=1);

final class PipeQueueRepository
{
    private PDO $pdo;

    // Backoff apos falha retryavel (doc 03 §5.1): imediata -> 30s -> 2min -> 10min -> 30min.
    // Indexado por numero de falhas ja acumuladas (attempts apos o incremento).
    private const BACKOFF = [1 => 30, 2 => 120, 3 => 600, 4 => 1800];
    private const MAX_ATTEMPTS = 5; // na 5a falha -> dead

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // ── Webhook events (log/dedup) ──────────────────────────────────

    /**
     * Registra a entrega do webhook. Idempotente por dedup_key (UNIQUE uq_dedup).
     * @return string 'received' (novo) | 'duplicate' (ja visto) — decide se enfileira.
     */
    public function recordWebhook(array $ev): string
    {
        $st = $this->pdo->prepare(
            "INSERT IGNORE INTO pipe_webhook_events
               (webhook_id, event_action, event_object, object_id, company_id, event_time,
                status, dedup_key, raw_payload, received_at)
             VALUES (:wid, :act, :obj, :oid, :co, :et, 'received', :dk, :raw, NOW())"
        );
        $st->execute([
            ':wid' => self::intOrNull($ev['webhook_id'] ?? null),
            ':act' => self::strOrNull($ev['action'] ?? null, 32),
            ':obj' => self::strOrNull($ev['object'] ?? null, 32),
            ':oid' => self::strOrNull($ev['object_id'] ?? null, 64),
            ':co'  => self::intOrNull($ev['company_id'] ?? null),
            ':et'  => $ev['event_time'] ?? null,
            ':dk'  => self::strOrNull($ev['dedup_key'] ?? null, 128),
            ':raw' => isset($ev['raw']) ? json_encode($ev['raw'], JSON_UNESCAPED_UNICODE) : null,
        ]);
        // rowCount()==0 com INSERT IGNORE => colidiu no dedup_key => duplicado.
        return $st->rowCount() > 0 ? 'received' : 'duplicate';
    }

    /** Marca o event como erro de recepcao (ex.: enfileiramento falhou). */
    public function markWebhookError(?string $dedupKey): void
    {
        if ($dedupKey === null || $dedupKey === '') { return; }
        $st = $this->pdo->prepare(
            "UPDATE pipe_webhook_events SET status = 'error', processed_at = NOW()
             WHERE dedup_key = :dk"
        );
        $st->execute([':dk' => $dedupKey]);
    }

    // ── Fila (pipe_sync_jobs) ───────────────────────────────────────

    /**
     * Enfileira um job de webhook (re-fetch + upsert). Colapsa duplicatas pendentes:
     * se ja existe um job pending para (entity, external_id), nao cria outro — a
     * proxima drenagem ja buscara o estado atual (a fila e "coalescente" por entidade).
     * @return int id do job (novo ou existente), 0 se nao aplicavel.
     */
    public function enqueueWebhook(string $entity, string $externalId, int $priority = 5): int
    {
        // Coalescing: reusa job pending existente para a mesma entidade+id.
        $sel = $this->pdo->prepare(
            "SELECT id FROM pipe_sync_jobs
              WHERE job_type = 'webhook' AND status = 'pending'
                AND entity = :e AND external_id = :x
              LIMIT 1"
        );
        $sel->execute([':e' => $entity, ':x' => $externalId]);
        $existing = $sel->fetchColumn();
        if ($existing !== false) { return (int)$existing; }

        $ins = $this->pdo->prepare(
            "INSERT INTO pipe_sync_jobs
               (job_type, entity, external_id, priority, status, attempts, next_attempt_at, created_at)
             VALUES ('webhook', :e, :x, :p, 'pending', 0, NOW(), NOW())"
        );
        $ins->execute([':e' => $entity, ':x' => $externalId, ':p' => $priority]);
        return (int)$this->pdo->lastInsertId();
    }

    /**
     * Reivindica ate $limit jobs elegiveis (pending e vencidos), marcando-os 'running'
     * atomicamente para nao serem pegos por outra drenagem concorrente. Ordena por
     * prioridade e idade. Retorna as linhas reivindicadas.
     */
    public function claimBatch(int $limit): array
    {
        $limit = max(1, min($limit, 500));
        $this->pdo->beginTransaction();
        try {
            // FOR UPDATE SKIP LOCKED evita corrida entre drenagens (MySQL 8+).
            $sel = $this->pdo->prepare(
                "SELECT id FROM pipe_sync_jobs
                  WHERE status = 'pending'
                    AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
                  ORDER BY priority ASC, id ASC
                  LIMIT {$limit}
                  FOR UPDATE SKIP LOCKED"
            );
            $sel->execute();
            $ids = $sel->fetchAll(PDO::FETCH_COLUMN);
            if (!$ids) { $this->pdo->commit(); return []; }

            $ph = implode(',', array_fill(0, count($ids), '?'));
            $upd = $this->pdo->prepare(
                "UPDATE pipe_sync_jobs SET status = 'running' WHERE id IN ({$ph})"
            );
            $upd->execute($ids);

            $get = $this->pdo->prepare(
                "SELECT id, job_type, entity, external_id, priority, attempts
                   FROM pipe_sync_jobs WHERE id IN ({$ph})"
            );
            $get->execute($ids);
            $rows = $get->fetchAll(PDO::FETCH_ASSOC);
            $this->pdo->commit();
            return $rows;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            throw $e;
        }
    }

    /** Conclui um job com sucesso. */
    public function completeJob(int $id): void
    {
        $st = $this->pdo->prepare(
            "UPDATE pipe_sync_jobs SET status = 'done', processed_at = NOW(), last_error = NULL
             WHERE id = :id"
        );
        $st->execute([':id' => $id]);
    }

    /**
     * Falha um job. Se retryavel e ainda ha tentativas -> reagenda com backoff+jitter.
     * Caso contrario (nao-retryavel ou esgotou tentativas) -> 'dead' + pipe_sync_errors.
     * @param int $attemptsBefore attempts que o job tinha ao ser reivindicado.
     */
    public function failJob(int $id, int $attemptsBefore, string $error, bool $retryable, ?string $errorCode = null, ?string $entity = null, ?string $externalId = null): string
    {
        $attempts = $attemptsBefore + 1;
        $err = substr($error, 0, 1024);

        if ($retryable && $attempts < self::MAX_ATTEMPTS) {
            $delay = self::BACKOFF[$attempts] ?? 1800;
            $delay += random_int(0, 5); // jitter pequeno para dessincronizar lotes
            $st = $this->pdo->prepare(
                "UPDATE pipe_sync_jobs
                    SET status = 'pending', attempts = :a, last_error = :e,
                        next_attempt_at = DATE_ADD(NOW(), INTERVAL :d SECOND)
                  WHERE id = :id"
            );
            $st->execute([':a' => $attempts, ':e' => $err, ':d' => $delay, ':id' => $id]);
            return 'retry';
        }

        // definitivo -> dead + registra o erro
        $st = $this->pdo->prepare(
            "UPDATE pipe_sync_jobs SET status = 'dead', attempts = :a, last_error = :e, processed_at = NOW()
              WHERE id = :id"
        );
        $st->execute([':a' => $attempts, ':e' => $err, ':id' => $id]);
        $this->recordError($entity, $externalId, $errorCode ?? 'JOB_DEAD', $error, $retryable);
        return 'dead';
    }

    private function recordError(?string $entity, ?string $externalId, string $code, string $message, bool $retryable): void
    {
        try {
            $st = $this->pdo->prepare(
                "INSERT INTO pipe_sync_errors (entity, external_id, error_code, message, retryable, created_at)
                 VALUES (:e, :x, :c, :m, :r, NOW())"
            );
            $st->execute([
                ':e' => self::strOrNull($entity, 32), ':x' => self::strOrNull($externalId, 64),
                ':c' => self::strOrNull($code, 64), ':m' => substr($message, 0, 1024),
                ':r' => $retryable ? 1 : 0,
            ]);
        } catch (\Throwable $e) {
            error_log('[pipedrive] recordError falhou: ' . $e->getMessage());
        }
    }

    // ── Observabilidade (endpoint admin /queue) ─────────────────────

    /** Contagens da fila por status + backlog vencido. */
    public function stats(): array
    {
        $counts = ['pending' => 0, 'running' => 0, 'done' => 0, 'error' => 0, 'dead' => 0];
        foreach ($this->pdo->query("SELECT status, COUNT(*) c FROM pipe_sync_jobs GROUP BY status") as $r) {
            $counts[$r['status']] = (int)$r['c'];
        }
        $due = (int)$this->pdo->query(
            "SELECT COUNT(*) FROM pipe_sync_jobs WHERE status='pending' AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())"
        )->fetchColumn();

        $wh = ['received' => 0, 'processed' => 0, 'error' => 0, 'duplicate' => 0];
        foreach ($this->pdo->query("SELECT status, COUNT(*) c FROM pipe_webhook_events GROUP BY status") as $r) {
            $wh[$r['status']] = (int)$r['c'];
        }
        $lastEvent = $this->pdo->query("SELECT MAX(received_at) FROM pipe_webhook_events")->fetchColumn();

        return [
            'jobs' => $counts,
            'due_now' => $due,
            'webhook_events' => $wh,
            'last_event_at' => $lastEvent ?: null,
        ];
    }

    /** Jobs mortos recentes (para a UI de alertas). */
    public function recentDead(int $limit = 20): array
    {
        $limit = max(1, min($limit, 100));
        $st = $this->pdo->query(
            "SELECT id, entity, external_id, attempts, last_error, processed_at
               FROM pipe_sync_jobs WHERE status = 'dead'
              ORDER BY processed_at DESC LIMIT {$limit}"
        );
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Reenfileira um job morto (recuperacao manual pelo admin). */
    public function requeueDead(int $id): bool
    {
        $st = $this->pdo->prepare(
            "UPDATE pipe_sync_jobs
                SET status = 'pending', attempts = 0, next_attempt_at = NOW(), last_error = NULL, processed_at = NULL
              WHERE id = :id AND status = 'dead'"
        );
        $st->execute([':id' => $id]);
        return $st->rowCount() > 0;
    }

    // ── helpers ─────────────────────────────────────────────────────
    private static function intOrNull($v): ?int
    {
        return ($v === null || $v === '') ? null : (int)$v;
    }

    private static function strOrNull($v, int $max): ?string
    {
        if ($v === null || $v === '') { return null; }
        return substr((string)$v, 0, $max);
    }
}
