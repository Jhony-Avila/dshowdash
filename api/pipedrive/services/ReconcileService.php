<?php
// Pipedrive / ReconcileService - reconciliacao de exclusoes (doc 03 §4, §27.5)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// As 6 entidades core deletadas somem da API apos 30 dias. Webhooks 'deleted.*'
// (Fase 2c) sao a fonte PRIMARIA; esta reconciliacao por polling e o backstop.
//
// Duas estrategias:
//   1) deleted-scan (deals)  — GET /deals?status=deleted (BARATO: so puxa deletados).
//        Marca is_deleted=1 nos deals que TEMOS localmente e sumiram. Roda sempre.
//   2) presence (person/org/product/activity) — diff de presenca: puxa TODOS os IDs
//        ativos da API e marca como deletado quem esta ativo localmente mas ausente
//        upstream. CARO (listagem completa) e SO marca se o pull terminou inteiro
//        (nunca deletar por pull parcial). Opt-in via strategy='presence'.
//
// Sempre soft delete (is_deleted=1) — nunca apaga fisicamente (mantem historico).
declare(strict_types=1);

final class PipeReconcileService
{
    private PDO $pdo;
    private PipeSyncRepository $repo;
    private PipeAccountRepository $accounts;

    // Entidades para presence-diff (deal fica de fora — coberto pelo deleted-scan barato).
    private const PRESENCE = [
        'person'       => ['persons', 'v2'],
        'organization' => ['organizations', 'v2'],
        'product'      => ['products', 'v2'],
        'activity'     => ['activities', 'v2'],
    ];

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repo = new PipeSyncRepository($pdo);
        $this->accounts = new PipeAccountRepository($pdo);
    }

    /**
     * @param array $opts ['strategy'=>'deleted-scan'|'presence', 'dry_run'=>bool, 'maxItems'=>int, 'maxPages'=>int]
     */
    public function reconcile(array $opts = []): array
    {
        $token = $this->accounts->getActiveToken();
        if ($token === null) { return ['ok' => false, 'error' => 'SEM_CREDENCIAL']; }
        $client = new PipedriveClient($token);

        $strategy = ($opts['strategy'] ?? 'deleted-scan') === 'presence' ? 'presence' : 'deleted-scan';
        $dryRun = !empty($opts['dry_run']);
        $companyId = (function () {
            $row = $this->accounts->getActiveRaw();
            return $row && $row['company_id'] !== null ? (int)$row['company_id'] : null;
        })();

        $runId = $this->repo->startRun($opts['run_type'] ?? 'manual', 'reconcile');
        $ents = [];

        // 1) deals — deleted-scan (sempre)
        $ents['deal'] = $this->dealsDeletedScan($client, $companyId, $opts, $dryRun);

        // 2) presence-diff (opt-in — caro)
        if ($strategy === 'presence') {
            foreach (self::PRESENCE as $entity => [$path, $version]) {
                $ents[$entity] = $this->presenceDiff($client, $entity, $path, $version, $opts, $dryRun);
            }
        }

        $ok = true;
        $totMarked = 0; $totApi = 0; $totCost = 0;
        foreach ($ents as $e) {
            if (($e['ok'] ?? true) === false) { $ok = false; }
            $totMarked += (int)($e['marked_deleted'] ?? 0);
            $totApi    += (int)($e['api_calls'] ?? 0);
            $totCost   += (int)($e['token_cost'] ?? 0);
        }
        $this->repo->finishRun($runId, [
            'processed' => $totMarked, 'marked_deleted' => $totMarked,
            'api_calls' => $totApi, 'token_cost' => $totCost, 'errors' => $ok ? 0 : 1,
        ], $ok ? 'completed' : 'failed');

        return ['ok' => $ok, 'strategy' => $strategy, 'dry_run' => $dryRun, 'entities' => $ents,
                'total_marked_deleted' => $totMarked];
    }

    /** deals: varre ?status=deleted e marca os que TEMOS localmente como is_deleted=1. */
    private function dealsDeletedScan(PipedriveClient $client, ?int $companyId, array $opts, bool $dryRun): array
    {
        // set O(1) dos deals ativos locais
        $localAtivos = array_fill_keys(array_map('intval', $this->repo->activeIds('deal')), true);

        $scanned = 0; $matched = [];
        $res = $client->paginate('deals', [
            'version' => 'v2',
            'query'   => ['status' => 'deleted', 'sort_by' => 'update_time', 'sort_direction' => 'desc'],
            'limit'   => (int)($opts['limit'] ?? 500),
            'maxPages' => (int)($opts['maxPages'] ?? 0),
            'maxItems' => (int)($opts['maxItems'] ?? 0),
        ], function (array $lote) use (&$scanned, &$matched, $localAtivos) {
            foreach ($lote as $d) {
                if (!is_array($d) || !isset($d['id'])) { continue; }
                $scanned++;
                $id = (int)$d['id'];
                if (isset($localAtivos[$id])) { $matched[] = (string)$id; }
            }
        });

        $marked = 0;
        if (!$dryRun && $matched) { $marked = $this->repo->markDeletedBatch('deal', $matched); }

        return [
            'ok' => (bool)($res['ok'] ?? false), 'strategy' => 'deleted-scan',
            'scanned' => $scanned, 'matched_local' => count($matched), 'marked_deleted' => $dryRun ? 0 : $marked,
            'api_calls' => (int)($res['api_calls'] ?? 0), 'token_cost' => (int)($res['token_cost'] ?? 0),
            'error' => $res['error'] ?? null,
        ];
    }

    /**
     * presence-diff: puxa TODOS os IDs ativos da API; marca como deletado quem esta
     * ativo localmente e ausente upstream. So marca se o pull terminou INTEIRO.
     */
    private function presenceDiff(PipedriveClient $client, string $entity, string $path, string $version, array $opts, bool $dryRun): array
    {
        $local = array_map('strval', $this->repo->activeIds($entity));
        if (!$local) { return ['ok' => true, 'strategy' => 'presence', 'skipped' => 'sem_registros_locais', 'marked_deleted' => 0]; }

        // Guarda de seguranca: caps tornam o pull INCOMPLETO -> nunca marcar.
        $maxPages = (int)($opts['maxPages'] ?? 0);
        $maxItems = (int)($opts['maxItems'] ?? 0);
        $incompletoPorCap = false;

        $seen = [];
        $res = $client->paginate($path, [
            'version' => $version, 'limit' => 500,
            'maxPages' => $maxPages, 'maxItems' => $maxItems,
        ], function (array $lote) use (&$seen) {
            foreach ($lote as $it) {
                if (is_array($it) && isset($it['id'])) { $seen[(string)$it['id']] = true; }
            }
        });

        // O pull parou por cap? (atingiu o teto configurado) -> incompleto
        if ($maxPages > 0 && ($res['pages'] ?? 0) >= $maxPages) { $incompletoPorCap = true; }
        if ($maxItems > 0 && ($res['items'] ?? 0) >= $maxItems) { $incompletoPorCap = true; }

        if (!($res['ok'] ?? false) || $incompletoPorCap) {
            return [
                'ok' => (bool)($res['ok'] ?? false), 'strategy' => 'presence',
                'incomplete' => true, 'reason' => $incompletoPorCap ? 'pull_truncado_por_cap' : 'pull_falhou',
                'marked_deleted' => 0, 'seen_upstream' => count($seen),
                'api_calls' => (int)($res['api_calls'] ?? 0), 'token_cost' => (int)($res['token_cost'] ?? 0),
                'error' => $res['error'] ?? null,
            ];
        }

        $ausentes = [];
        foreach ($local as $id) { if (!isset($seen[$id])) { $ausentes[] = $id; } }

        $marked = 0;
        if (!$dryRun && $ausentes) { $marked = $this->repo->markDeletedBatch($entity, $ausentes); }

        return [
            'ok' => true, 'strategy' => 'presence',
            'local_active' => count($local), 'seen_upstream' => count($seen),
            'missing' => count($ausentes), 'marked_deleted' => $dryRun ? 0 : $marked,
            'api_calls' => (int)($res['api_calls'] ?? 0), 'token_cost' => (int)($res['token_cost'] ?? 0),
        ];
    }
}
