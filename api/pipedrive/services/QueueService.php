<?php
// Pipedrive / QueueService - ingest orientado a eventos (webhook -> fila -> re-fetch)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Fluxo:
//   1) receber()  o receptor grava o webhook (dedup) e enfileira 1 job por entidade.
//   2) drenar()   o worker (CLI --mode=drain-queue) reivindica jobs pendentes, RE-BUSCA
//                 a entidade na API (fonte da verdade) e faz upsert idempotente.
//
// Por que re-buscar em vez de aplicar o payload do webhook:
//   - webhooks chegam fora de ordem e podem ser reentregues -> re-fetch sempre pega o
//     estado atual, tornando ordem/duplicidade inofensivas (doc 03 §3);
//   - nao confiamos em dado vindo de fora sem revalidar na fonte;
//   - 404 no re-fetch = entidade excluida a montante -> soft delete local (doc 03 §4).
declare(strict_types=1);

final class PipeQueueService
{
    private PDO $pdo;
    private PipeQueueRepository $queue;
    private PipeSyncRepository $repo;
    private PipeAccountRepository $accounts;

    // entidade -> [versao API, path de listagem/single, metodo de upsert no SyncRepository]
    private const ENTITIES = [
        'deal'         => ['v2',     'deals',         'upsertDeal',         1],
        'lead'         => ['v1root', 'leads',         'upsertLead',         2],
        'person'       => ['v2',     'persons',       'upsertPerson',       3],
        'organization' => ['v2',     'organizations', 'upsertOrganization', 3],
        'activity'     => ['v2',     'activities',    'upsertActivity',     4],
        'product'      => ['v2',     'products',      'upsertProduct',      4],
        'note'         => ['v1',     'notes',         'upsertNote',         5],
        'stage'        => ['v2',     'stages',        'upsertStage',        5],
        'pipeline'     => ['v2',     'pipelines',     'upsertPipeline',     5],
        'user'         => ['v1',     'users',         'upsertUser',         5],
    ];

    public function __construct(PDO $pdo)
    {
        $this->pdo      = $pdo;
        $this->queue    = new PipeQueueRepository($pdo);
        $this->repo     = new PipeSyncRepository($pdo);
        $this->accounts = new PipeAccountRepository($pdo);
    }

    // ── Recepcao (chamada pelo receptor /webhook) ───────────────────

    /**
     * Registra a entrega e enfileira o trabalho. Rapido e sem I/O de rede (o re-fetch
     * acontece so na drenagem), para responder 2XX ao Pipedrive em < 10s.
     * @return array ['status'=>'enqueued'|'duplicate'|'ignored', 'job_id'=>?int]
     */
    public function ingestWebhook(array $payload): array
    {
        $ev = self::parseWebhook($payload);
        if ($ev === null) {
            return ['status' => 'ignored', 'reason' => 'unparseable'];
        }

        $recorded = $this->queue->recordWebhook($ev);
        if ($recorded === 'duplicate') {
            return ['status' => 'duplicate', 'dedup_key' => $ev['dedup_key']];
        }

        // So enfileira entidades que sabemos sincronizar e com id valido.
        $entity = $ev['object'];
        if ($entity === null || $ev['object_id'] === null || !isset(self::ENTITIES[$entity])) {
            return ['status' => 'ignored', 'reason' => 'entity_not_synced', 'object' => $entity];
        }

        try {
            $priority = self::ENTITIES[$entity][3];
            $jobId = $this->queue->enqueueWebhook($entity, (string)$ev['object_id'], $priority);
            return ['status' => 'enqueued', 'job_id' => $jobId, 'entity' => $entity];
        } catch (\Throwable $e) {
            $this->queue->markWebhookError($ev['dedup_key']);
            error_log('[pipedrive] enqueueWebhook falhou: ' . $e->getMessage());
            return ['status' => 'ignored', 'reason' => 'enqueue_failed'];
        }
    }

    /**
     * Extrai os campos do evento de formatos v1 (meta.object/meta.id) e v2
     * (meta.entity/meta.entity_id). Normaliza a acao e monta um dedup_key estavel
     * entre reentregas do MESMO evento (retries compartilham timestamp).
     */
    public static function parseWebhook(array $p): ?array
    {
        $meta = is_array($p['meta'] ?? null) ? $p['meta'] : [];
        $data = is_array($p['data'] ?? null) ? $p['data']
              : (is_array($p['current'] ?? null) ? $p['current'] : []);

        $action = $meta['action'] ?? null;
        $object = $meta['entity'] ?? ($meta['object'] ?? null);
        $objectId = $meta['entity_id'] ?? ($meta['id'] ?? ($data['id'] ?? null));
        if ($action === null && $object === null && $objectId === null) {
            return null; // nao parece um webhook do Pipedrive
        }

        $action = self::normalizeAction((string)$action);
        $object = $object !== null ? (string)$object : null;
        $eventTime = self::eventTime($meta['timestamp'] ?? ($p['event_time'] ?? null));

        // dedup: identidade do evento (nao da tentativa). Retries -> mesma chave.
        $raw = $action . '.' . ($object ?? '?') . '.' . ($objectId ?? '?') . '.' . ($eventTime ?? '');
        $dedup = strlen($raw) > 128 ? ('h:' . sha1($raw)) : $raw;

        return [
            'action'     => $action,
            'object'     => $object,
            'object_id'  => $objectId,
            'company_id' => $meta['company_id'] ?? null,
            'webhook_id' => $meta['webhook_id'] ?? null,
            'event_time' => $eventTime,
            'dedup_key'  => $dedup,
            'raw'        => $p,
        ];
    }

    private static function normalizeAction(string $a): string
    {
        $a = strtolower(trim($a));
        static $map = ['change' => 'updated', 'add' => 'added', 'create' => 'added',
                       'delete' => 'deleted', 'merge' => 'merged'];
        return $map[$a] ?? $a;
    }

    /** Timestamp do evento (unix ou ISO) -> 'Y-m-d H:i:s' em UTC. null se indecifravel. */
    private static function eventTime($ts): ?string
    {
        if ($ts === null || $ts === '') { return null; }
        if (is_numeric($ts)) {
            $n = (int)$ts;
            if ($n > 1_000_000_000_000) { $n = (int)($n / 1000); } // milissegundos
            return gmdate('Y-m-d H:i:s', $n);
        }
        $t = strtotime((string)$ts);
        return $t !== false ? gmdate('Y-m-d H:i:s', $t) : null;
    }

    // ── Drenagem da fila (chamada pelo CLI --mode=drain-queue) ──────

    /**
     * Processa ate $limit jobs elegiveis. Sem credencial ativa -> nao reivindica nada
     * (os jobs esperam a reconexao). Retorna contadores.
     */
    public function drainQueue(int $limit = 100): array
    {
        $token = $this->accounts->getActiveToken();
        if ($token === null) {
            return ['ok' => false, 'error' => 'SEM_CREDENCIAL', 'claimed' => 0, 'done' => 0, 'deleted' => 0, 'retry' => 0, 'dead' => 0];
        }
        $client = new PipedriveClient($token);
        $companyId = (function () {
            $row = $this->accounts->getActiveRaw();
            return $row && $row['company_id'] !== null ? (int)$row['company_id'] : null;
        })();

        $jobs = $this->queue->claimBatch($limit);
        $c = ['ok' => true, 'error' => null, 'claimed' => count($jobs), 'done' => 0, 'deleted' => 0, 'retry' => 0, 'dead' => 0];

        foreach ($jobs as $job) {
            $id       = (int)$job['id'];
            $entity   = (string)$job['entity'];
            $extId    = (string)$job['external_id'];
            $attempts = (int)$job['attempts'];
            try {
                $res = $this->processJob($client, $entity, $extId, $companyId);
            } catch (\Throwable $e) {
                // erro inesperado no processamento -> retryavel
                $res = ['ok' => false, 'retryable' => true, 'error' => $e->getMessage(), 'code' => 'EXCEPTION'];
            }

            if ($res['ok']) {
                $this->queue->completeJob($id);
                if (($res['action'] ?? '') === 'deleted') { $c['deleted']++; } else { $c['done']++; }
            } else {
                $out = $this->queue->failJob($id, $attempts, (string)($res['error'] ?? 'erro'), (bool)($res['retryable'] ?? true), $res['code'] ?? null, $entity, $extId);
                $out === 'dead' ? $c['dead']++ : $c['retry']++;
            }
        }
        return $c;
    }

    /**
     * Re-busca UMA entidade na API e aplica. 404/410 => soft delete local.
     * @return array ['ok'=>bool,'action'=>'upsert'|'deleted','retryable'=>bool,'error'=>?,'code'=>?]
     */
    private function processJob(PipedriveClient $client, string $entity, string $extId, ?int $companyId): array
    {
        $map = self::ENTITIES[$entity] ?? null;
        if ($map === null) {
            return ['ok' => false, 'retryable' => false, 'error' => 'entidade nao suportada: ' . $entity, 'code' => 'UNKNOWN_ENTITY'];
        }
        [$version, $path, $upsert] = $map;

        $res = $client->request('GET', $version, '/' . $path . '/' . rawurlencode($extId));
        $this->accounts->logApiRequest('GET', '/' . $path . '/{id}', $res);
        $status = (int)($res['status'] ?? 0);

        // Excluido a montante -> soft delete local (idempotente).
        if ($status === 404 || $status === 410) {
            $this->repo->markDeleted($entity, $extId);
            return ['ok' => true, 'action' => 'deleted'];
        }

        if (($res['ok'] ?? false) && is_array($res['data'] ?? null)) {
            $obj = $res['data'];
            // Alguns single-GET aninham em data.item; normaliza.
            if (isset($obj['item']) && is_array($obj['item'])) { $obj = $obj['item']; }
            if ($entity === 'deal') {
                $this->repo->upsertDeal($obj, $companyId);
            } else {
                $this->repo->{$upsert}($obj);
            }
            return ['ok' => true, 'action' => 'upsert'];
        }

        // Classificacao de erro (doc 03 §5.2)
        $error = (string)($res['error'] ?? ('HTTP_' . $status));
        if ($status === 401) { return ['ok' => false, 'retryable' => false, 'error' => $error, 'code' => 'UNAUTHORIZED']; }
        if ($status === 403) { return ['ok' => false, 'retryable' => false, 'error' => $error, 'code' => 'FORBIDDEN']; }
        if ($status === 422 || $status === 400) { return ['ok' => false, 'retryable' => false, 'error' => $error, 'code' => 'INVALID']; }
        // 429 / 5xx / rede (status 0) -> retryavel
        return ['ok' => false, 'retryable' => true, 'error' => $error, 'code' => $status === 429 ? 'RATE_LIMITED' : 'UPSTREAM'];
    }
}
