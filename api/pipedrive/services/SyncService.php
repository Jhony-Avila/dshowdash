<?php
// Pipedrive / SyncService - orquestra a sincronizacao (fetch API -> persist local)
// @version 1.0.0
// @created 2026-07-21
// @app Pipedrive Analytics
//
// Ordem por dependencia (doc 03 §1): pipelines -> stages -> users -> deals.
// Reference = full a cada rodada (volume minimo). Deals = incremental por
// marca-d'agua (updated_since + sort_by=update_time asc); 'full' ignora a marca.
// Caps opcionais (maxPages/maxItems) para rodada de teste sem estourar token.
declare(strict_types=1);

final class PipeSyncService
{
    private PDO $pdo;
    private PipeSyncRepository $repo;
    private PipeAccountRepository $accounts;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repo = new PipeSyncRepository($pdo);
        $this->accounts = new PipeAccountRepository($pdo);
    }

    private function client(): ?PipedriveClient
    {
        $token = $this->accounts->getActiveToken();
        return $token ? new PipedriveClient($token) : null;
    }

    /** Rodada completa: reference + custom fields + todas as entidades. $mode: 'incremental'|'full'. */
    public function run(string $mode = 'incremental', array $opts = []): array
    {
        $client = $this->client();
        if (!$client) {
            return ['ok' => false, 'error' => 'SEM_CREDENCIAL', 'message' => 'Nenhuma credencial ativa. Conecte na tela de Configuracoes.'];
        }
        $companyId = (function () {
            $row = $this->accounts->getActiveRaw();
            return $row && $row['company_id'] !== null ? (int)$row['company_id'] : null;
        })();

        $r = [];
        // 1) Reference (full — volume minimo)
        $r['pipelines'] = $this->syncEntity($client, 'pipelines', 'pipelines', 'v2', fn(array $x) => $this->repo->upsertPipeline($x), [], $opts, true);
        $r['stages']    = $this->syncEntity($client, 'stages', 'stages', 'v2', fn(array $x) => $this->repo->upsertStage($x), [], $opts, true);
        $r['users']     = $this->syncEntity($client, 'users', 'users', 'v1', fn(array $x) => $this->repo->upsertUser($x), [], $opts, true);
        // 2) Custom fields (defs+opcoes) — antes das entidades que os usam
        $r['custom_fields'] = $this->syncCustomFields($client, $opts);
        // 3) Entidades por dependencia (v2 incremental; v1 full)
        $r['organizations'] = $this->syncList($client, 'organizations', 'organizations', 'v2', fn(array $x) => $this->repo->upsertOrganization($x), $mode, $opts, true);
        $r['persons']       = $this->syncList($client, 'persons', 'persons', 'v2', fn(array $x) => $this->repo->upsertPerson($x), $mode, $opts, true);
        $r['products']      = $this->syncList($client, 'products', 'products', 'v2', fn(array $x) => $this->repo->upsertProduct($x), $mode, $opts, true);
        $r['deals']         = $this->syncDeals($client, $mode, $companyId, $opts);
        $r['activities']    = $this->syncList($client, 'activities', 'activities', 'v2', fn(array $x) => $this->repo->upsertActivity($x), $mode, $opts, true);
        $r['leads']         = $this->syncList($client, 'leads', 'leads', 'v1root', fn(array $x) => $this->repo->upsertLead($x), $mode, $opts, true);
        $r['notes']         = $this->syncList($client, 'notes', 'notes', 'v1', fn(array $x) => $this->repo->upsertNote($x), $mode, $opts, true);

        // 4) Metricas (LOCAL, zero API) — recalcula ao fim de cada rodada.
        $this->computeMetrics();

        $ok = true;
        foreach ($r as $e) { if (!($e['ok'] ?? false)) { $ok = false; } }
        return ['ok' => $ok, 'mode' => $mode, 'entities' => $r];
    }

    /** Recalcula as series pre-agregadas (diaria + horaria). Local — nao chama a API. */
    public function computeMetrics(int $days = 180, int $hours = 72): array
    {
        $m = new PipeMetricsRepository($this->pdo);
        try {
            $d = $m->computeDaily($days);
            $h = $m->computeHourly($hours);
            return ['ok' => true, 'daily_rows' => $d, 'hourly_rows' => $h];
        } catch (\Throwable $e) {
            error_log('[pipedrive] computeMetrics falhou: ' . $e->getMessage());
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Sincroniza os PRODUTOS de cada negocio (GET /v2/deals/{id}/products — 1 chamada/deal).
     * CARO em token: limitado por $opts['maxDeals'] (rodada de teste) e so negocios
     * open/won por padrao. Aborta se acumular muitos erros seguidos.
     */
    public function syncDealProducts(array $opts = []): array
    {
        $client = $this->client();
        if (!$client) { return ['ok' => false, 'error' => 'SEM_CREDENCIAL']; }

        $maxDeals  = isset($opts['maxDeals']) && (int)$opts['maxDeals'] > 0 ? (int)$opts['maxDeals'] : null;
        $onlyActive = ($opts['onlyActive'] ?? true) !== false;
        $ids = $this->repo->dealIdsForProducts($maxDeals, $onlyActive);

        $runId = $this->repo->startRun($opts['run_type'] ?? 'manual', 'deal_products');
        $c = ['processed' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'marked_deleted' => 0, 'errors' => 0, 'api_calls' => 0, 'token_cost' => 0, 'items' => 0];
        $errosSeguidos = 0;

        foreach ($ids as $dealId) {
            $res = $client->request('GET', 'v2', '/deals/' . $dealId . '/products');
            $this->accounts->logApiRequest('GET', '/deals/{id}/products', $res);
            $c['api_calls']++;
            $c['token_cost'] += 20;
            $c['processed']++;

            if (!($res['ok'] ?? false)) {
                // 404 = negocio sem produtos ou removido -> nao e erro fatal
                if ((int)($res['status'] ?? 0) === 404) { $this->repo->upsertDealProducts($dealId, []); $c['updated']++; $errosSeguidos = 0; continue; }
                $c['errors']++;
                if (++$errosSeguidos >= 5) { error_log('[pipedrive] deal_products: 5 erros seguidos, abortando'); break; }
                continue;
            }
            $errosSeguidos = 0;
            $produtos = is_array($res['data'] ?? null) ? $res['data'] : [];
            try {
                $n = $this->repo->upsertDealProducts($dealId, $produtos);
                $c['items'] += $n;
                $c['updated']++;
            } catch (\Throwable $e) {
                $c['errors']++;
                error_log('[pipedrive] upsertDealProducts deal ' . $dealId . ': ' . $e->getMessage());
            }
        }

        $ok = $c['errors'] === 0;
        $this->repo->finishRun($runId, $c, $ok ? 'completed' : 'failed');
        // produtos alteram a receita agregada -> recalcula metricas
        $this->computeMetrics();
        return ['ok' => $ok, 'entity' => 'deal_products', 'stats' => $c, 'total_deals' => count($ids)];
    }

    /** Campos personalizados das 5 entidades (full). */
    private function syncCustomFields(PipedriveClient $client, array $opts): array
    {
        $mapa = [
            'deal' => 'dealFields', 'person' => 'personFields', 'organization' => 'organizationFields',
            'product' => 'productFields', 'activity' => 'activityFields',
        ];
        $runId = $this->repo->startRun($opts['run_type'] ?? 'manual', 'custom_fields');
        $c = ['processed' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'marked_deleted' => 0, 'errors' => 0, 'api_calls' => 0, 'token_cost' => 0];
        $ok = true;
        foreach ($mapa as $entity => $path) {
            // Endpoints de fields: v1 devolve `key` (hash 40) + options {id,label}; o v2 usa
            // field_name/field_code (sem o hash usado nos custom_fields dos registros).
            $res = $client->paginate($path, ['version' => 'v1', 'limit' => 500, 'maxPages' => (int)($opts['maxPages'] ?? 0)],
                function (array $lote) use (&$c, $entity) {
                    foreach ($lote as $f) {
                        if (!is_array($f)) { $c['skipped']++; continue; }
                        $c['processed']++;
                        try { $this->repo->upsertCustomField($entity, $f); $c['updated']++; }
                        catch (\Throwable $e) { $c['errors']++; error_log('[pipedrive] custom_field ' . $entity . ': ' . $e->getMessage()); }
                    }
                });
            $c['api_calls'] += (int)($res['api_calls'] ?? 0);
            $c['token_cost'] += (int)($res['token_cost'] ?? 0);
            if (!($res['ok'] ?? false)) { $ok = false; $c['errors']++; }
        }
        $this->repo->finishRun($runId, $c, $ok ? 'completed' : 'failed');
        return ['ok' => $ok, 'entity' => 'custom_fields', 'stats' => $c];
    }

    /**
     * Sincroniza uma listagem generica. v2 incremental por marca-d'agua (updated_since +
     * sort_by=update_time asc) quando $incremental e mode!=full; v1 sempre full (offset).
     */
    private function syncList(PipedriveClient $client, string $entity, string $path, string $version, callable $upsert, string $mode, array $opts, bool $incrementalCapable): array
    {
        $runId = $this->repo->startRun($opts['run_type'] ?? 'manual', $entity);
        $c = ['processed' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'marked_deleted' => 0, 'errors' => 0, 'api_calls' => 0, 'token_cost' => 0];

        // Incremental por marca-d'agua. v2: updated_since (ASC). v1/v1root NAO tem
        // updated_since -> ordena por update_time DESC e PARA CEDO ao passar a marca
        // (sorted-DESC + stop-early), evitando re-puxar todo o historico (ex.: 26k notas).
        $isV2 = $version === 'v2';
        $doIncremental = $incrementalCapable && $mode !== 'full';
        $wm = $doIncremental ? ($this->repo->getCursor($entity)['watermark_update_time'] ?? null) : null;
        $wmDt = $wm ? substr(str_replace('T', ' ', $wm), 0, 19) : null;

        $query = [];
        $v1StopEarly = false;
        if ($doIncremental && $isV2) {
            $query = ['sort_by' => 'update_time', 'sort_direction' => 'asc'];
            if ($wmDt) { $query['updated_since'] = str_replace(' ', 'T', $wmDt) . 'Z'; }
        } elseif ($doIncremental && !$isV2 && $wmDt !== null) {
            $query = ['sort' => 'update_time DESC'];
            $v1StopEarly = true;
        }
        // v1/v1root sem marca-d'agua (1a vez) = full pull.

        $maxUpdate = null;
        $res = $client->paginate($path, [
            'version' => $version, 'query' => $query,
            'limit' => (int)($opts['limit'] ?? 500), 'maxPages' => (int)($opts['maxPages'] ?? 0), 'maxItems' => (int)($opts['maxItems'] ?? 0),
        ], function (array $lote) use (&$c, &$maxUpdate, $upsert, $v1StopEarly, $wmDt) {
            $minLote = null;
            foreach ($lote as $item) {
                if (!is_array($item)) { $c['skipped']++; continue; }
                $c['processed']++;
                try {
                    $out = $upsert($item);
                    $out === 'created' ? $c['created']++ : $c['updated']++;
                    if (!empty($item['is_deleted'])) { $c['marked_deleted']++; }
                } catch (\Throwable $e) {
                    $c['errors']++;
                    error_log('[pipedrive] upsert ' . $c['processed'] . ' (' . ($item['id'] ?? '?') . '): ' . $e->getMessage());
                }
                $ut = PipeSyncRepository::dt($item['update_time'] ?? null);
                if ($ut !== null) {
                    if ($maxUpdate === null || $ut > $maxUpdate) { $maxUpdate = $ut; }
                    if ($minLote === null || $ut < $minLote) { $minLote = $ut; }
                }
            }
            // Ordenado DESC: se o item mais antigo do lote ja e < marca, os proximos
            // sao ainda mais antigos -> ja temos tudo, para de paginar.
            if ($v1StopEarly && $wmDt !== null && $minLote !== null && $minLote < $wmDt) { return false; }
            return true;
        });

        $c['api_calls'] = (int)($res['api_calls'] ?? 0);
        $c['token_cost'] = (int)($res['token_cost'] ?? 0);
        $ok = (bool)($res['ok'] ?? false);
        if (!$ok) { $c['errors']++; }

        $incrementalRun = $doIncremental && ($isV2 || $v1StopEarly);
        $this->repo->bumpWatermark($entity, $maxUpdate); // GREATEST: so avanca
        if (!$incrementalRun && $ok) { $this->repo->markFullSync($entity); }
        $this->repo->finishRun($runId, $c, $ok ? 'completed' : 'failed');

        return ['ok' => $ok, 'entity' => $entity, 'stats' => $c, 'error' => $res['error'] ?? null];
    }

    /** So os dados de referencia (pipelines/stages/users), full. */
    public function syncReference(array $opts = []): array
    {
        $client = $this->client();
        if (!$client) { return ['ok' => false, 'error' => 'SEM_CREDENCIAL']; }
        return [
            'ok' => true,
            'entities' => [
                'pipelines' => $this->syncEntity($client, 'pipelines', 'pipelines', 'v2', fn(array $x) => $this->repo->upsertPipeline($x), [], $opts, true),
                'stages'    => $this->syncEntity($client, 'stages', 'stages', 'v2', fn(array $x) => $this->repo->upsertStage($x), [], $opts, true),
                'users'     => $this->syncEntity($client, 'users', 'users', 'v1', fn(array $x) => $this->repo->upsertUser($x), [], $opts, true),
            ],
        ];
    }

    // ── nucleo generico de sincronizacao de uma entidade ────────
    /**
     * @param callable $upsert  fn(array $item): 'created'|'updated'
     * @param bool     $full    marca last_full_sync_at ao final
     */
    private function syncEntity(PipedriveClient $client, string $entity, string $path, string $version, callable $upsert, array $query, array $opts, bool $full): array
    {
        $runId = $this->repo->startRun($opts['run_type'] ?? 'manual', $entity);
        $c = ['processed' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'marked_deleted' => 0, 'errors' => 0, 'api_calls' => 0, 'token_cost' => 0];
        $maxUpdate = null;

        $res = $client->paginate($path, [
            'version'  => $version,
            'query'    => $query,
            'limit'    => (int)($opts['limit'] ?? 500),
            'maxPages' => (int)($opts['maxPages'] ?? 0),
            'maxItems' => (int)($opts['maxItems'] ?? 0),
        ], function (array $lote, array $meta, int $page) use (&$c, &$maxUpdate, $upsert) {
            foreach ($lote as $item) {
                if (!is_array($item)) { $c['skipped']++; continue; }
                $c['processed']++;
                try {
                    $out = $upsert($item);
                    $out === 'created' ? $c['created']++ : $c['updated']++;
                    if (!empty($item['is_deleted'])) { $c['marked_deleted']++; }
                } catch (\Throwable $e) {
                    $c['errors']++;
                    error_log('[pipedrive] upsert falhou (' . ($item['id'] ?? '?') . '): ' . $e->getMessage());
                }
                $ut = PipeSyncRepository::dt($item['update_time'] ?? ($item['modified'] ?? null));
                if ($ut !== null && ($maxUpdate === null || $ut > $maxUpdate)) { $maxUpdate = $ut; }
            }
        });

        $c['api_calls'] = (int)($res['api_calls'] ?? 0);
        $c['token_cost'] = (int)($res['token_cost'] ?? 0);
        $ok = (bool)($res['ok'] ?? false);
        if (!$ok) { $c['errors']++; }

        $this->repo->bumpWatermark($entity, $maxUpdate);
        if ($full && $ok) { $this->repo->markFullSync($entity); }
        $this->repo->finishRun($runId, $c, $ok ? 'completed' : 'failed');

        return ['ok' => $ok, 'entity' => $entity, 'stats' => $c, 'error' => $res['error'] ?? null];
    }

    private function syncDeals(PipedriveClient $client, string $mode, ?int $companyId, array $opts): array
    {
        $runId = $this->repo->startRun($opts['run_type'] ?? 'manual', 'deals');
        $c = ['processed' => 0, 'created' => 0, 'updated' => 0, 'skipped' => 0, 'marked_deleted' => 0, 'errors' => 0, 'api_calls' => 0, 'token_cost' => 0];

        $query = ['sort_by' => 'update_time', 'sort_direction' => 'asc'];
        $incremental = ($mode !== 'full');
        if ($incremental) {
            $cur = $this->repo->getCursor('deals');
            $wm = $cur['watermark_update_time'] ?? null;
            if ($wm) {
                // DATETIME local (UTC) -> RFC3339 para o updated_since
                $query['updated_since'] = str_replace(' ', 'T', substr($wm, 0, 19)) . 'Z';
            }
        }

        $maxUpdate = null;
        $res = $client->paginate('deals', [
            'version'  => 'v2',
            'query'    => $query,
            'limit'    => (int)($opts['limit'] ?? 500),
            'maxPages' => (int)($opts['maxPages'] ?? 0),
            'maxItems' => (int)($opts['maxItems'] ?? 0),
        ], function (array $lote, array $meta, int $page) use (&$c, &$maxUpdate, $companyId) {
            foreach ($lote as $item) {
                if (!is_array($item)) { $c['skipped']++; continue; }
                $c['processed']++;
                try {
                    $out = $this->repo->upsertDeal($item, $companyId);
                    $out === 'created' ? $c['created']++ : $c['updated']++;
                    if (!empty($item['is_deleted'])) { $c['marked_deleted']++; }
                } catch (\Throwable $e) {
                    $c['errors']++;
                    error_log('[pipedrive] upsertDeal falhou (' . ($item['id'] ?? '?') . '): ' . $e->getMessage());
                }
                $ut = PipeSyncRepository::dt($item['update_time'] ?? null);
                if ($ut !== null && ($maxUpdate === null || $ut > $maxUpdate)) { $maxUpdate = $ut; }
            }
        });

        $c['api_calls'] = (int)($res['api_calls'] ?? 0);
        $c['token_cost'] = (int)($res['token_cost'] ?? 0);
        $ok = (bool)($res['ok'] ?? false);
        if (!$ok) { $c['errors']++; }

        $this->repo->bumpWatermark('deals', $maxUpdate);
        if (!$incremental && $ok) { $this->repo->markFullSync('deals'); }
        $this->repo->finishRun($runId, $c, $ok ? 'completed' : 'failed');

        return ['ok' => $ok, 'entity' => 'deals', 'mode' => $mode, 'stats' => $c, 'error' => $res['error'] ?? null];
    }
}
