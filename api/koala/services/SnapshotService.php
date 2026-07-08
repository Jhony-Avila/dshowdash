<?php
// /api/koala/services/SnapshotService.php
// Import/snapshot: congela o cliente remoto na proposta e traz itens do orçamento como line items locais.
// Regra do briefing: o snapshot NUNCA altera o cadastro original (só SELECT remoto + INSERT local).
// @module koala.service.snapshot @version 1.0.0-F2
declare(strict_types=1);

class SnapshotService
{
    private \PDO $pdo;
    private RemoteErpRepository $erp;

    public function __construct(\PDO $pdo, ?RemoteErpRepository $erp = null)
    {
        $this->pdo = $pdo;
        $this->erp = $erp ?? new RemoteErpRepository();
    }

    private function graceful(callable $fn)
    {
        try { return $fn(); }
        catch (RemoteUnavailableException $e) {
            ApiResponse::error('REMOTE_UNAVAILABLE', 503, ['message' => 'ERP indisponivel. Tente novamente.']);
        }
    }

    /** Garante que a proposta tenha um snapshot de cliente (cria vazio p/ preenchimento manual). Retorna o id. */
    public function ensureSnapshot(array $koala, int $proposalId): int
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);   // 404/403
        $snapId = (int) ($p['client_snapshot_id'] ?? 0);
        if ($snapId > 0) { return $snapId; }
        // A4: cria snapshot vazio + vincula à proposta atomicamente.
        return KoalaTx::run($this->pdo, function () use ($proposalId) {
            $snapId = (new ClientSnapshotRepository($this->pdo))->insertEmpty();
            (new ProposalRepository($this->pdo))->setClientSnapshot($proposalId, $snapId, null);
            return $snapId;
        });
    }

    /** Bloco cliente completo (snapshot + contatos) para retorno/render. */
    public function getClientBlock(int $proposalId, ?int $snapshotId): array
    {
        if (!$snapshotId) { return ['snapshot' => null, 'contacts' => []]; }
        return [
            'snapshot' => (new ClientSnapshotRepository($this->pdo))->findById($snapshotId),
            'contacts' => (new ClientSnapshotContactRepository($this->pdo))->listBySnapshot($snapshotId),
        ];
    }

    private static function validateCep($cep): ?string
    {
        if ($cep === null || $cep === '') { return null; }
        $digits = preg_replace('/\D/', '', (string) $cep);
        if (strlen($digits) !== 8) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'postal_code', 'message' => 'CEP deve ter 8 dígitos']);
        }
        return $digits;
    }

    /** Edita a cópia LOCAL do cliente na proposta (NUNCA altera o ERP). */
    public function updateClient(array $koala, int $proposalId, array $data): array
    {
        // Valida ANTES de materializar o snapshot (evita snapshot vazio órfão em erro).
        if (array_key_exists('postal_code', $data)) {
            $data['postal_code'] = self::validateCep($data['postal_code']);
        }
        if (isset($data['document_type']) && !in_array($data['document_type'], ['CPF', 'CNPJ'], true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'document_type', 'allowed' => ['CPF', 'CNPJ']]);
        }
        // A4: materialização do snapshot + update na mesma transação.
        return KoalaTx::run($this->pdo, function () use ($koala, $proposalId, $data) {
            $snapId = $this->ensureSnapshot($koala, $proposalId);
            (new ClientSnapshotRepository($this->pdo))->update($snapId, $data);
            return $this->getClientBlock($proposalId, $snapId);
        });
    }

    // ---- Contatos repetíveis do cliente ------------------------------------
    private function requireContactOfProposal(array $koala, int $proposalId, int $contactId): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);   // 404/403
        $snapId = (int) ($p['client_snapshot_id'] ?? 0);
        $c = (new ClientSnapshotContactRepository($this->pdo))->findById($contactId);
        if ($c === null || (int) $c['snapshot_id'] !== $snapId || $snapId === 0) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['contact_id' => $contactId]);
        }
        return $c;
    }

    private static function validateContact(array $d): void
    {
        $type = $d['contact_type'] ?? 'phone';
        if (!in_array($type, ClientSnapshotContactRepository::TYPES, true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'contact_type', 'allowed' => ClientSnapshotContactRepository::TYPES]);
        }
        if (trim((string) ($d['contact_value'] ?? '')) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'contact_value', 'message' => 'Valor do contato é obrigatório']);
        }
        if ($type === 'email' && !filter_var($d['contact_value'], FILTER_VALIDATE_EMAIL)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'contact_value', 'message' => 'E-mail inválido']);
        }
    }

    public function listContacts(array $koala, int $proposalId): array
    {
        $p = (new ProposalService($this->pdo))->get($koala, $proposalId);
        $snapId = (int) ($p['client_snapshot_id'] ?? 0);
        return $snapId ? (new ClientSnapshotContactRepository($this->pdo))->listBySnapshot($snapId) : [];
    }

    public function addContact(array $koala, int $proposalId, array $d): array
    {
        self::validateContact($d);
        // A4: materialização do snapshot + insert do contato na mesma transação.
        return KoalaTx::run($this->pdo, function () use ($koala, $proposalId, $d) {
            $snapId = $this->ensureSnapshot($koala, $proposalId);
            $repo = new ClientSnapshotContactRepository($this->pdo);
            $d['display_order'] = $repo->maxOrder($snapId) + 1;
            $id = $repo->insert($snapId, $d);
            return ['contact' => $repo->findById($id), 'contacts' => $repo->listBySnapshot($snapId)];
        });
    }

    public function updateContact(array $koala, int $proposalId, int $contactId, array $d): array
    {
        $c = $this->requireContactOfProposal($koala, $proposalId, $contactId);
        $merged = array_merge($c, $d);
        self::validateContact($merged);
        $repo = new ClientSnapshotContactRepository($this->pdo);
        $repo->update($contactId, $merged);
        return ['contact' => $repo->findById($contactId), 'contacts' => $repo->listBySnapshot((int) $c['snapshot_id'])];
    }

    public function removeContact(array $koala, int $proposalId, int $contactId): array
    {
        $c = $this->requireContactOfProposal($koala, $proposalId, $contactId);
        $repo = new ClientSnapshotContactRepository($this->pdo);
        $repo->delete($contactId);
        return ['removed' => $contactId, 'contacts' => $repo->listBySnapshot((int) $c['snapshot_id'])];
    }

    /** Copia o cliente remoto para koala_client_snapshots e vincula à proposta. */
    public function importClient(array $koala, int $proposalId, int $externalClientId): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId);   // 404/403
        $ven = PermissionService::erpVendorScope($koala);               // vendedor só importa cliente que orçou
        $d = $this->graceful(fn() => $this->erp->getClientDetail($externalClientId, $ven));
        if ($d === null) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['message' => 'Cliente remoto nao encontrado', 'id' => $externalClientId]);
        }

        $isPJ = ($d['tipo'] ?? '') === 'PJ' || !empty($d['cnpj']);
        $snap = [
            'external_client_id' => $externalClientId,
            'contact_email'      => $d['email'] ?? null,
            'raw'                => $d,
        ];
        if ($isPJ) {
            $snap += [
                'client_name'       => $d['nome_fantasia'] ?: ($d['razao_social'] ?? null),
                'trade_name'        => $d['nome_fantasia'] ?? null,
                'legal_name'        => $d['razao_social'] ?? null,
                'document_type'     => 'CNPJ',
                'document_number'   => $d['cnpj'] ?? null,
                'state_registration'=> $d['inscricao_estadual'] ?? null,
            ];
        } else {
            $snap += [
                'client_name'     => $d['pessoa_nome'] ?? null,
                'document_type'   => 'CPF',
                'document_number' => $d['cpf'] ?? null,
            ];
        }

        // A4: insert do snapshot + vínculo à proposta na mesma transação (fetch remoto já ocorreu fora).
        return KoalaTx::run($this->pdo, function () use ($snap, $proposalId) {
            $snapId = (new ClientSnapshotRepository($this->pdo))->insert($snap);
            (new ProposalRepository($this->pdo))->setClientSnapshot($proposalId, $snapId, null);
            return [
                'client_snapshot' => (new ClientSnapshotRepository($this->pdo))->findById($snapId),
                'proposal'        => (new ProposalRepository($this->pdo))->findById($proposalId),
            ];
        });
    }

    /** Traz os itens de um Orcamento remoto como line items locais (o que não mapear vira avulso). */
    public function importOrcamento(array $koala, int $proposalId, int $orcId): array
    {
        $proposal = (new ProposalService($this->pdo))->get($koala, $proposalId);   // 404/403
        $ven = PermissionService::erpVendorScope($koala);              // vendedor só importa orçamento que é dele
        $rows = $this->graceful(fn() => $this->erp->getOrcamentoItems($orcId, $ven));

        $itemsRepo = new ProposalItemRepository($this->pdo);

        // A3 (consolidação 2026-07-04): import atômico — N inserts + budget_number + recompute
        // numa única transação. Falha no meio reverte tudo (nada de proposta com itens pela metade).
        // O fetch remoto (getOrcamentoItems) fica FORA da transação (só SELECT no ERP).
        return KoalaTx::run($this->pdo, function () use ($itemsRepo, $rows, $proposalId, $orcId) {
            $order = $itemsRepo->maxOrder($proposalId);
            $imported = 0;
            foreach ($rows as $r) {
                $qty = (float) ($r['Qtd'] ?? 0);
                if ($qty <= 0) { $qty = 1; }                                  // avulso: qty inválida -> 1
                $desc = trim((string) ($r['Descricao'] ?? ''));
                if ($desc === '') { $desc = 'Item importado (orcamento ' . $orcId . ')'; }
                $data = [
                    'catalog_item_id' => null,                                // veio do ERP, não do catálogo koala
                    'description'     => mb_substr($desc, 0, 255),
                    'category_name'   => $r['Categoria'] ?? ($r['categoria_item'] ?? null),
                    'quantity'        => $qty,
                    'unit_measure'    => null,
                    'unit_price'      => (float) ($r['Valor_Uni'] ?? 0),
                    'observation'     => isset($r['Observacao']) ? mb_substr((string) $r['Observacao'], 0, 255) : null,
                    'display_order'   => ++$order,
                ];
                $c = PricingCalculationService::computeItem($data);
                $data['subtotal'] = $c['subtotal'];
                $itemsRepo->insert($proposalId, $data);
                $imported++;
            }

            // vincula o número do orçamento à proposta
            (new ProposalRepository($this->pdo))->updateFields($proposalId, ['budget_number' => (string) $orcId]);
            $totals = (new ProposalItemService($this->pdo))->recompute($proposalId);

            return [
                'imported'    => $imported,
                'items'       => $itemsRepo->listDraft($proposalId),
                'totals'      => $totals,
            ];
        });
    }
}
