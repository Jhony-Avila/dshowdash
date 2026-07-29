<?php
// Pipedrive / QueueRepository - persistencia do ingest orientado a eventos
// @version 1.1.0
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

    // ── Fila morta em massa (#41) ───────────────────────────────────
    //
    // Um job morto e um pedido de "re-buscar a entidade X na API". Dois mortos com o
    // mesmo (entity, external_id) pedem EXATAMENTE o mesmo trabalho — reenfileirar os
    // dois gastaria duas chamadas de API para o mesmo objeto. Por isso o lote reenfileira
    // UM job por alvo e absorve os irmaos (ver requeueDeadBulk).
    //
    // Teto por chamada: reenfileirar e barato no banco e CARO na API (1 re-fetch por
    // alvo, sujeito ao rate limit do Pipedrive). O teto existe para que um clique nao
    // vire milhares de chamadas; o que sobra e informado, nunca descartado em silencio.
    public const REQUEUE_MAX = 200;

    /** Marcador gravado no irmao absorvido — mantem o coalescing auditavel. */
    private const COALESCED = 'COALESCIDO_NO_JOB_';

    /**
     * Entidades REALMENTE presentes entre os mortos. E a allow-list do filtro: o valor
     * do usuario apenas ESCOLHE um destes, nunca entra no SQL como texto livre.
     */
    public function deadEntities(): array
    {
        $st = $this->pdo->query(
            "SELECT DISTINCT entity FROM pipe_sync_jobs WHERE status = 'dead' AND entity IS NOT NULL ORDER BY entity"
        );
        return $st->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Agregacao dos mortos para o painel: total, alvos distintos (= chamadas de API que
     * um reprocessamento completo custaria) e recorte por entidade e por erro.
     */
    public function deadStats(): array
    {
        $tot = $this->pdo->query(
            "SELECT COUNT(*) total, COUNT(DISTINCT CONCAT(COALESCE(entity,''), ':', COALESCE(external_id,''))) alvos,
                    MIN(processed_at) mais_antigo, MAX(processed_at) mais_novo
               FROM pipe_sync_jobs WHERE status = 'dead'"
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $porEntidade = $this->pdo->query(
            "SELECT COALESCE(entity,'(sem entidade)') entity, COUNT(*) total,
                    COUNT(DISTINCT external_id) alvos, MAX(processed_at) mais_novo
               FROM pipe_sync_jobs WHERE status = 'dead'
              GROUP BY entity ORDER BY total DESC"
        )->fetchAll(PDO::FETCH_ASSOC);

        // Agrupa pelo inicio da mensagem: o final costuma trazer id/timestamp, que
        // separaria em grupos de 1 o que na pratica e a mesma falha.
        $porErro = $this->pdo->query(
            "SELECT SUBSTRING(COALESCE(last_error,'(sem mensagem)'), 1, 80) erro, COUNT(*) total
               FROM pipe_sync_jobs WHERE status = 'dead'
              GROUP BY erro ORDER BY total DESC LIMIT 10"
        )->fetchAll(PDO::FETCH_ASSOC);

        return [
            'total'        => (int)($tot['total'] ?? 0),
            'alvos'        => (int)($tot['alvos'] ?? 0),
            'mais_antigo'  => $tot['mais_antigo'] ?? null,
            'mais_novo'    => $tot['mais_novo'] ?? null,
            'por_entidade' => array_map(static fn($r) => [
                'entity' => $r['entity'], 'total' => (int)$r['total'],
                'alvos'  => (int)$r['alvos'], 'mais_novo' => $r['mais_novo'],
            ], $porEntidade),
            'por_erro'     => array_map(static fn($r) => [
                'erro' => $r['erro'], 'total' => (int)$r['total'],
            ], $porErro),
            'teto_lote'    => self::REQUEUE_MAX,
        ];
    }

    /**
     * Lista paginada dos mortos. $entity DEVE vir de deadEntities() (ja validado pelo
     * controller) — aqui ele so entra como valor vinculado.
     */
    public function listDead(?string $entity, int $page, int $perPage): array
    {
        $perPage = max(1, min($perPage, 100));
        $page    = max(1, $page);
        $off     = ($page - 1) * $perPage;

        $where = "status = 'dead'" . ($entity !== null ? " AND entity = :e" : '');
        $bind  = $entity !== null ? [':e' => $entity] : [];

        $cst = $this->pdo->prepare("SELECT COUNT(*) FROM pipe_sync_jobs WHERE {$where}");
        $cst->execute($bind);
        $total = (int)$cst->fetchColumn();

        $st = $this->pdo->prepare(
            "SELECT id, job_type, entity, external_id, attempts, last_error, created_at, processed_at
               FROM pipe_sync_jobs WHERE {$where}
              ORDER BY processed_at DESC, id DESC
              LIMIT {$perPage} OFFSET {$off}"
        );
        $st->execute($bind);

        return [
            'itens'     => $st->fetchAll(PDO::FETCH_ASSOC),
            'total'     => $total,
            'page'      => $page,
            'per_page'  => $perPage,
            'paginas'   => (int)ceil($total / $perPage),
        ];
    }

    /**
     * Reenfileira mortos em lote. Recebe OU uma lista de ids OU uma entidade inteira —
     * nunca "tudo por omissao": chamar sem alvo nao reprocessa nada.
     *
     * Colapso por alvo: entre mortos do mesmo (entity, external_id), so o mais recente
     * volta para 'pending'. Os irmaos sao encerrados como 'done' com o marcador
     * COALESCIDO_NO_JOB_<id> em last_error — o trabalho deles E o do job que voltou,
     * entao mante-los mortos deixaria ruido permanente no painel, e reenfileira-los
     * gastaria chamadas de API repetidas no mesmo objeto.
     *
     * @param int[]|null   $ids    ids explicitos (o que a UI selecionou)
     * @param string|null  $entity entidade inteira; DEVE vir de deadEntities()
     */
    public function requeueDeadBulk(?array $ids, ?string $entity, int $limite): array
    {
        $limite = max(1, min($limite, self::REQUEUE_MAX));
        $vazio  = ['reenfileirados' => 0, 'colapsados' => 0, 'alvos' => 0, 'restantes' => 0, 'ids' => []];

        // Sem alvo explicito nao ha operacao: um lote destrutivo nunca deve
        // interpretar "nada" como "tudo".
        $temIds = is_array($ids) && $ids !== [];
        if (!$temIds && $entity === null) { return $vazio; }

        $where = "status = 'dead'";
        $bind  = [];
        if ($temIds) {
            $ids = array_values(array_unique(array_map('intval', $ids)));
            $ids = array_filter($ids, static fn($i) => $i > 0);
            if (!$ids) { return $vazio; }
            $ph     = implode(',', array_fill(0, count($ids), '?'));
            $where .= " AND id IN ({$ph})";
            $bind   = array_values($ids);
        } elseif ($entity !== null) {
            $where .= ' AND entity = ?';
            $bind   = [$entity];
        }

        $this->pdo->beginTransaction();
        try {
            // Trava as linhas escolhidas: sem isso, uma drenagem concorrente poderia
            // mudar o status entre a leitura e o UPDATE.
            $sel = $this->pdo->prepare(
                "SELECT id, entity, external_id FROM pipe_sync_jobs
                  WHERE {$where}
                  ORDER BY processed_at DESC, id DESC
                  FOR UPDATE"
            );
            $sel->execute($bind);
            $linhas = $sel->fetchAll(PDO::FETCH_ASSOC);
            if (!$linhas) { $this->pdo->commit(); return $vazio; }

            // Agrupa por alvo preservando a ordem (o primeiro de cada grupo e o mais recente).
            $porAlvo = [];
            foreach ($linhas as $l) {
                $chave = ($l['entity'] ?? '') . ':' . ($l['external_id'] ?? '');
                $porAlvo[$chave][] = (int)$l['id'];
            }
            $alvosTotal = count($porAlvo);

            // O teto conta ALVOS (= chamadas de API), nao linhas: 300 mortos do mesmo
            // negocio custam uma chamada so e nao deveriam consumir o lote inteiro.
            $escolhidos = array_slice($porAlvo, 0, $limite, true);
            $restantes  = $alvosTotal - count($escolhidos);

            $lideres = [];
            $irmaos  = [];   // id do irmao => id do lider que assumiu o trabalho
            foreach ($escolhidos as $grupo) {
                $lider     = array_shift($grupo);
                $lideres[] = $lider;
                foreach ($grupo as $outro) { $irmaos[$outro] = $lider; }
            }

            $ph  = implode(',', array_fill(0, count($lideres), '?'));
            $upd = $this->pdo->prepare(
                "UPDATE pipe_sync_jobs
                    SET status = 'pending', attempts = 0, next_attempt_at = NOW(),
                        last_error = NULL, processed_at = NULL
                  WHERE status = 'dead' AND id IN ({$ph})"
            );
            $upd->execute($lideres);
            $reenfileirados = $upd->rowCount();

            $colapsados = 0;
            if ($irmaos) {
                $st = $this->pdo->prepare(
                    "UPDATE pipe_sync_jobs
                        SET status = 'done', processed_at = NOW(), last_error = :m
                      WHERE status = 'dead' AND id = :id"
                );
                foreach ($irmaos as $idIrmao => $lider) {
                    $st->execute([':m' => self::COALESCED . $lider, ':id' => $idIrmao]);
                    $colapsados += $st->rowCount();
                }
            }

            $this->pdo->commit();
            return [
                'reenfileirados' => $reenfileirados,
                'colapsados'     => $colapsados,
                'alvos'          => count($lideres),
                'restantes'      => $restantes,
                'ids'            => $lideres,
            ];
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            throw $e;
        }
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
