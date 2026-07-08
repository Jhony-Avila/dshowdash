<?php
// /api/koala/services/VersioningService.php
// F5 — Versionamento: freeze de MARCO (PDF/publicar/restaurar) congela o estado COMPLETO da proposta
// como versão imutável; o rascunho corrente segue editável. Renderiza versão congelada byte-idêntica.
// @module koala.service.versioning @version 1.0.0-F5
declare(strict_types=1);

class VersioningService
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo) { $this->pdo = $pdo; }

    // Campos voláteis (mudam sem alteração de conteúdo) — removidos do cálculo do hash de dirty-detection.
    private const VOLATILE = ['updated_at', 'created_at', 'current_version_id', 'pdf_path',
        'published_version_id', 'published_at', 'public_revoked_at', 'public_slug', 'public_url'];

    /** Remove recursivamente chaves voláteis (só p/ o hash; o snapshot guarda o raw completo). */
    private static function stripVolatile($v)
    {
        if (!is_array($v)) { return $v; }
        $out = [];
        foreach ($v as $k => $val) {
            if (is_string($k) && in_array($k, self::VOLATILE, true)) { continue; }
            $out[$k] = self::stripVolatile($val);
        }
        return $out;
    }

    /** Captura o estado RAW editável (p/ restaurar depois) — números crus, não formatados. */
    private function captureRaw(int $proposalId, array $p): array
    {
        $snapId  = !empty($p['client_snapshot_id']) ? (int) $p['client_snapshot_id'] : null;
        $client  = $snapId ? (new ClientSnapshotRepository($this->pdo))->findById($snapId) : null;
        $contacts = $snapId ? (new ClientSnapshotContactRepository($this->pdo))->listBySnapshot($snapId) : [];
        return [
            'proposal'      => $p, // linha completa (COLS) — restore usa só o subconjunto EDITABLE + totais.
            'items'         => (new ProposalItemRepository($this->pdo))->listDraft($proposalId),
            'expenses'      => (new ProposalExpenseRepository($this->pdo))->listDraft($proposalId),
            'client'        => $client,
            'contacts'      => $contacts,
            'payment_terms' => (new ProposalPaymentTermRepository($this->pdo))->listByProposal($proposalId),
        ];
    }

    /**
     * Congela o estado atual como versão de MARCO. Se nada mudou desde o último freeze (mesmo hash),
     * REUSA a última versão (não duplica). Não gerencia transação (compõe com restore()).
     * @return array{version_id:int,version_number:int,reused:bool,snapshot_hash:string,trigger:string}
     */
    public function freeze(array $koala, int $proposalId, string $trigger, string $renderMode = 'final', ?int $restoredFrom = null): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);          // 404/403
        $build = (new ProposalRenderService($this->pdo))->buildLiveData($koala, $proposalId);
        $raw   = $this->captureRaw($proposalId, $p);

        $snapshot = [
            'render'              => ['structure' => $build['structure'], 'data' => $build['data']],
            'render_mode'         => $renderMode,
            'raw'                 => $raw,
            'business'            => $build['business'],
            'template_version_id' => $build['template_version_id'],
        ];
        // Hash sobre um raw CANÔNICO (sem campos voláteis) — senão current_version_id/updated_at
        // mudam a cada freeze e a dirty-detection nunca casaria (regerar sem mudança duplicaria).
        $hash = hash('sha256', json_encode(['raw' => self::stripVolatile($raw), 'tvid' => $build['template_version_id']], JSON_UNESCAPED_UNICODE));

        $repo = new ProposalVersionRepository($this->pdo);
        $last = $repo->lastByProposal($proposalId);
        if ($last !== null && (string) ($last['snapshot_hash'] ?? '') === $hash && $restoredFrom === null) {
            return [
                'version_id'     => (int) $last['id'],
                'version_number' => (int) $last['version_number'],
                'reused'         => true,
                'snapshot_hash'  => $hash,
                'trigger'        => (string) ($last['trigger_event'] ?? $trigger),
            ];
        }

        $vn = ($last['version_number'] ?? 0) + 1;
        $vid = $repo->insert([
            'proposal_id'              => $proposalId,
            'version_number'           => $vn,
            'trigger_event'            => $trigger,
            'template_id'              => $build['template_id'] ?: null,
            'template_version_id'      => $build['template_version_id'] ?: null,
            'snapshot_json'            => json_encode($snapshot, JSON_UNESCAPED_UNICODE),
            'snapshot_hash'            => $hash,
            'totals_json'              => json_encode($build['business'], JSON_UNESCAPED_UNICODE),
            'created_by'               => (int) ($koala['id'] ?? 0) ?: null,
            'restored_from_version_id' => $restoredFrom,
        ]);
        // current_version_id aponta a versão congelada mais recente.
        $this->pdo->prepare('UPDATE koala_proposals SET current_version_id = ? WHERE id = ?')->execute([$vid, $proposalId]);

        (new LogService($this->pdo))->log($koala, [
            'proposal_id' => $proposalId, 'proposal_version_id' => $vid,
            'action' => 'proposal_version_frozen', 'entity_type' => 'version', 'entity_id' => $vid,
            'metadata' => ['trigger' => $trigger, 'version' => $vn],
        ]);

        return ['version_id' => $vid, 'version_number' => $vn, 'reused' => false, 'snapshot_hash' => $hash, 'trigger' => $trigger];
    }

    /** Histórico (mais recente primeiro), enriquecido com total da versão. */
    public function listVersions(array $koala, int $proposalId): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId); // auth
        $rows = (new ProposalVersionRepository($this->pdo))->listByProposal($proposalId);
        return array_map(function ($v) {
            $tot = json_decode((string) ($v['totals_json'] ?? ''), true) ?: [];
            return [
                'id'             => (int) $v['id'],
                'version_number' => (int) $v['version_number'],
                'trigger_event'  => $v['trigger_event'],
                'created_at'     => $v['created_at'],
                'has_pdf'        => !empty($v['pdf_path']),
                'restored_from'  => $v['restored_from_version_id'] ? (int) $v['restored_from_version_id'] : null,
                'total_final'    => $tot['total_final'] ?? null,
                'currency'       => $tot['currency'] ?? null,
                'status'         => $tot['status'] ?? null,
            ];
        }, $rows);
    }

    /** Snapshot decodificado de uma versão da proposta (valida pertencimento). */
    public function getSnapshot(array $koala, int $proposalId, int $versionId): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId); // auth
        $v = (new ProposalVersionRepository($this->pdo))->findById($versionId);
        if ($v === null || (int) $v['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['version' => $versionId]);
        }
        $snap = json_decode((string) $v['snapshot_json'], true);
        if (!is_array($snap)) { ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'snapshot invalido']); }
        $snap['_meta'] = ['version_id' => (int) $v['id'], 'version_number' => (int) $v['version_number'], 'pdf_path' => $v['pdf_path'] ?? null];
        return $snap;
    }

    /** Renderiza a versão CONGELADA (readonly). $mode null => usa o render_mode salvo no freeze. */
    public function renderVersion(array $koala, int $proposalId, int $versionId, ?string $mode = null): string
    {
        $snap = $this->getSnapshot($koala, $proposalId, $versionId);
        $renderData = ['structure' => $snap['render']['structure'] ?? null, 'data' => $snap['render']['data'] ?? null];
        $useMode = $mode ?? ($snap['render_mode'] ?? 'final');
        return (new ProposalRenderService($this->pdo))->renderFromSnapshot($renderData, $useMode);
    }

    /**
     * Restaura o estado de uma versão para o rascunho corrente. GATE: gestor/admin.
     * Congela o estado ATUAL antes (nada se perde) e copia o snapshot escolhido de volta.
     */
    public function restore(array $koala, int $proposalId, int $versionId): array
    {
        PermissionService::requireManagerOrAdmin($koala); // só gestor/admin restaura
        $svc = new ProposalService($this->pdo);
        $svc->get($koala, $proposalId); // auth + existência
        $target = (new ProposalVersionRepository($this->pdo))->findById($versionId);
        if ($target === null || (int) $target['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['version' => $versionId]);
        }
        $snap = json_decode((string) $target['snapshot_json'], true);
        $raw = $snap['raw'] ?? null;
        if (!is_array($raw)) { ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'versao sem raw p/ restaurar']); }

        // 1) congela o estado atual ANTES (preserva o que está lá).
        $this->freeze($koala, $proposalId, 'restore', 'final');

        // 2) copia o snapshot escolhido de volta ao rascunho, atomicamente.
        $this->pdo->beginTransaction();
        try {
            $propRepo = new ProposalRepository($this->pdo);
            $rp = $raw['proposal'] ?? [];
            $editable = [];
            foreach (ProposalRepository::EDITABLE as $k) {
                if (array_key_exists($k, $rp)) { $editable[$k] = $rp[$k]; }
            }
            if ($editable) { $propRepo->updateFields($proposalId, $editable); }
            $propRepo->updateTotals($proposalId, [
                'total_gross'    => $rp['total_gross'] ?? 0,
                'total_discount' => $rp['total_discount'] ?? 0,
                'total_addition' => $rp['total_addition'] ?? 0,
                'total_net'      => $rp['total_net'] ?? 0,
                'total_expenses' => $rp['total_expenses'] ?? 0,
                'total_final'    => $rp['total_final'] ?? 0,
            ]);

            // itens: some os atuais (soft), reinsere os da versão.
            $itemRepo = new ProposalItemRepository($this->pdo);
            foreach ($itemRepo->listDraft($proposalId) as $it) { $itemRepo->delete((int) $it['id']); }
            foreach (($raw['items'] ?? []) as $it) { $itemRepo->insert($proposalId, $it); }

            // despesas: idem.
            $expRepo = new ProposalExpenseRepository($this->pdo);
            foreach ($expRepo->listDraft($proposalId) as $ex) { $expRepo->delete((int) $ex['id']); }
            foreach (($raw['expenses'] ?? []) as $ex) { $expRepo->insert($proposalId, $ex); }

            // cliente (cópia local) + contatos.
            $snapId = !empty($rp['client_snapshot_id']) ? (int) $rp['client_snapshot_id'] : null;
            if ($snapId && is_array($raw['client'] ?? null)) {
                $csRepo = new ClientSnapshotRepository($this->pdo);
                $upd = [];
                foreach (ClientSnapshotRepository::EDITABLE as $k) {
                    if (array_key_exists($k, $raw['client'])) { $upd[$k] = $raw['client'][$k]; }
                }
                if ($upd) { $csRepo->update($snapId, $upd); }
                $ctRepo = new ClientSnapshotContactRepository($this->pdo);
                foreach ($ctRepo->listBySnapshot($snapId) as $c) { $ctRepo->delete((int) $c['id']); }
                foreach (($raw['contacts'] ?? []) as $c) { $ctRepo->insert($snapId, $c); }
            }

            // formas de pagamento.
            $ptRepo = new ProposalPaymentTermRepository($this->pdo);
            foreach ($ptRepo->listByProposal($proposalId) as $t) { $ptRepo->delete((int) $t['id']); }
            foreach (($raw['payment_terms'] ?? []) as $t) { $ptRepo->insert($proposalId, $t); }

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            // NÃO ecoar $e->getMessage() ao cliente: uma PDOException traria SQLSTATE/tabela/coluna
            // (mapa do schema). Detalhe só no log server-side; resposta genérica.
            error_log('[koala] restore proposta ' . $proposalId . ' falhou: ' . $e->getMessage());
            ApiResponse::error(ApiResponse::ERR_INTERNAL_ERROR, 500, ['message' => 'Falha ao restaurar a versão.']);
        }

        (new LogService($this->pdo))->log($koala, [
            'proposal_id' => $proposalId, 'proposal_version_id' => $versionId,
            'action' => 'proposal_restored', 'entity_type' => 'proposal', 'entity_id' => $proposalId,
            'metadata' => ['restored_from_version' => (int) $target['version_number']],
        ]);

        return $svc->get($koala, $proposalId);
    }
}
