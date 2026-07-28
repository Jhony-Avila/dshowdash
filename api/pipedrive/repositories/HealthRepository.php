<?php
// Pipedrive / HealthRepository - saude da sincronizacao (backlog #39).
// @version 1.0.0
// @created 2026-07-22
// @app Pipedrive Analytics
//
// Observabilidade do que ja roda em producao (crons incremental/drain/reconcile/
// deal-products). TUDO local: le pipe_sync_runs / pipe_sync_cursors / pipe_sync_errors
// / pipe_api_requests. NAO chama a API do Pipedrive.
declare(strict_types=1);

final class PipeHealthRepository
{
    private PDO $pdo;

    // Entidades sincronizadas de forma ESPARSA (agendadas, nao a cada 15min).
    // Para elas nao faz sentido alertar "parada" pelo tempo desde a ultima rodada.
    private const SPARSE = ['reconcile', 'deal_products'];

    // Limite (min) para considerar uma entidade continua "atrasada" (~3x o cron de 15min).
    private const STALE_MIN = 60;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** Estado por entidade: ultima rodada + cursor (watermark) + sinal de atraso. */
    public function entities(): array
    {
        $sql = "SELECT lr.entity, lr.finished_at AS last_run_at, lr.status AS last_run_status,
                       lr.errors AS last_run_errors, lr.processed, lr.created, lr.updated, lr.marked_deleted,
                       TIMESTAMPDIFF(MINUTE, lr.finished_at, NOW()) AS min_since_run,
                       c.watermark_update_time, c.last_full_sync_at
                  FROM (
                        SELECT entity, finished_at, status, errors, processed, created, updated, marked_deleted,
                               ROW_NUMBER() OVER (PARTITION BY entity ORDER BY finished_at DESC, id DESC) rn
                          FROM pipe_sync_runs
                       ) lr
             LEFT JOIN pipe_sync_cursors c ON c.entity = lr.entity
                 WHERE lr.rn = 1
              ORDER BY (lr.entity IN ('reconcile','deal_products')), lr.finished_at DESC";
        $rows = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function ($r) {
            $entity = (string)$r['entity'];
            $sparse = in_array($entity, self::SPARSE, true);
            $min = $r['min_since_run'] !== null ? (int)$r['min_since_run'] : null;
            $errors = (int)$r['last_run_errors'];
            $status = (string)$r['last_run_status'];
            $ok = $status === 'completed' && $errors === 0;
            $stale = !$sparse && $min !== null && $min > self::STALE_MIN;
            return [
                'entity'         => $entity,
                'sparse'         => $sparse,
                'last_run_at'    => $r['last_run_at'],
                'last_run_status' => $status,
                'last_run_errors' => $errors,
                'min_since_run'  => $min,
                'processed'      => (int)$r['processed'],
                'created'        => (int)$r['created'],
                'updated'        => (int)$r['updated'],
                'marked_deleted' => (int)$r['marked_deleted'],
                'watermark'      => $r['watermark_update_time'],
                'last_full_sync_at' => $r['last_full_sync_at'],
                'healthy'        => $ok && !$stale,
                'stale'          => $stale,
            ];
        }, $rows);
    }

    /** Erros de sincronizacao mais recentes. */
    public function recentErrors(int $limit = 15): array
    {
        $limit = max(1, min($limit, 100));
        $st = $this->pdo->query(
            "SELECT entity, external_id, error_code, message, retryable, created_at
               FROM pipe_sync_errors
           ORDER BY created_at DESC, id DESC
              LIMIT {$limit}"
        );
        return array_map(static fn($r) => [
            'entity'      => $r['entity'],
            'external_id' => $r['external_id'],
            'error_code'  => $r['error_code'],
            'message'     => $r['message'],
            'retryable'   => (int)$r['retryable'],
            'created_at'  => $r['created_at'],
        ], $st->fetchAll(PDO::FETCH_ASSOC));
    }

    /** Uso da API nas ultimas $hours horas (chamadas, erros, custo em tokens). */
    public function apiUsage(int $hours = 24): array
    {
        $hours = max(1, min($hours, 720));
        $st = $this->pdo->query(
            "SELECT COUNT(*) calls, COALESCE(SUM(result='error'),0) errors, COALESCE(SUM(token_cost),0) tokens
               FROM pipe_api_requests
              WHERE created_at >= NOW() - INTERVAL {$hours} HOUR"
        );
        $r = $st->fetch(PDO::FETCH_ASSOC) ?: [];
        return [
            'hours'  => $hours,
            'calls'  => (int)($r['calls'] ?? 0),
            'errors' => (int)($r['errors'] ?? 0),
            'tokens' => (int)($r['tokens'] ?? 0),
        ];
    }
}
