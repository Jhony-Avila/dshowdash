<?php
// /api/koala/services/ProposalItemService.php
// Line items dentro da proposta + recálculo dos totais (backend = fonte de verdade).
// @module koala.service.proposal_item @version 1.0.0-F2
declare(strict_types=1);

class ProposalItemService
{
    private \PDO $pdo;
    private ProposalItemRepository $items;
    private ProposalRepository $proposals;
    private ItemRepository $catalog;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->items = new ProposalItemRepository($pdo);
        $this->proposals = new ProposalRepository($pdo);
        $this->catalog = new ItemRepository($pdo);
    }

    /** Carrega a proposta autorizada para o usuário (404/403 dentro). */
    private function loadProposal(array $koala, int $proposalId): array
    {
        return (new ProposalService($this->pdo))->get($koala, $proposalId);
    }

    private static function requirePositiveQty($qty): float
    {
        $q = (float) $qty;
        if ($q <= 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'quantity', 'message' => 'Quantidade deve ser > 0']);
        }
        return $q;
    }

    /**
     * Validação de linha (item OU despesa) — 422 com mensagem clara.
     * Semântica de desconto: valor tem precedência sobre percentual; percentual 0–100;
     * desconto em valor não pode ser negativo (o cap no bruto é feito no cálculo).
     */
    public static function validateLine(array $d): void
    {
        if (trim((string) ($d['description'] ?? '')) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'description', 'message' => 'Descrição é obrigatória']);
        }
        self::requirePositiveQty($d['quantity'] ?? 0);
        if (isset($d['unit_price']) && (float) $d['unit_price'] < 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'unit_price', 'message' => 'Valor unitário não pode ser negativo']);
        }
        if (isset($d['discount_value']) && $d['discount_value'] !== null && $d['discount_value'] !== '' && (float) $d['discount_value'] < 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'discount_value', 'message' => 'Desconto (valor) não pode ser negativo']);
        }
        if (isset($d['discount_percent']) && $d['discount_percent'] !== null && $d['discount_percent'] !== '') {
            $dp = (float) $d['discount_percent'];
            if ($dp < 0 || $dp > 100) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'discount_percent', 'message' => 'Desconto (%) deve estar entre 0 e 100']);
            }
        }
        if (isset($d['addition_value']) && $d['addition_value'] !== null && $d['addition_value'] !== '' && (float) $d['addition_value'] < 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'addition_value', 'message' => 'Acréscimo (valor) não pode ser negativo']);
        }
        if (isset($d['addition_percent']) && $d['addition_percent'] !== null && $d['addition_percent'] !== '') {
            $ap = (float) $d['addition_percent'];
            if ($ap < 0 || $ap > 1000) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'addition_percent', 'message' => 'Acréscimo (%) deve estar entre 0 e 1000']);
            }
        }
        if (isset($d['observation']) && $d['observation'] !== null && mb_strlen((string) $d['observation']) > 2000) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'observation', 'message' => 'Observação excede 2000 caracteres']);
        }
    }

    /**
     * Recalcula e persiste os totais da proposta (itens + despesas operacionais +
     * frete/instal/desloc legados − desconto da proposta). Fonte de verdade única.
     * Chamado tanto pela edição de itens quanto de despesas. Retorna os totais.
     */
    public function recompute(int $proposalId): array
    {
        $p = $this->proposals->findById($proposalId);
        if ($p === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404); }
        $rows     = $this->items->listDraft($proposalId);
        $expenses = (new ProposalExpenseRepository($this->pdo))->listDraft($proposalId);
        $totals = PricingCalculationService::computeTotals(
            $rows,
            (float) ($p['freight_value'] ?? 0),
            (float) ($p['installation_value'] ?? 0),
            (float) ($p['displacement_value'] ?? 0),
            $expenses,
            $p['proposal_discount_value'] ?? null,
            $p['proposal_discount_percent'] ?? null
        );
        $this->proposals->updateTotals($proposalId, $totals);
        return $totals;
    }

    public function list(array $koala, int $proposalId): array
    {
        $this->loadProposal($koala, $proposalId);
        return array_map([PricingCalculationService::class, 'withLineTotals'], $this->items->listDraft($proposalId));
    }

    public function addFromCatalog(array $koala, int $proposalId, int $catalogItemId, array $ov): array
    {
        $proposal = $this->loadProposal($koala, $proposalId);
        $ci = $this->catalog->findById($catalogItemId);
        if ($ci === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['catalog_item_id' => $catalogItemId]); }

        // Bi-moeda: puxa o preço na MOEDA DA PROPOSTA. Sem preço nessa moeda = moeda mista bloqueada.
        $cur = strtoupper((string) $proposal['currency']);
        $price = $cur === 'USD' ? $ci['default_unit_price_usd'] : $ci['default_unit_price_brl'];
        if ($price === null) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, [
                'field' => 'currency',
                'message' => "Item do catalogo sem preco em $cur (moeda da proposta). Moeda mista bloqueada.",
            ]);
        }
        $qty = self::requirePositiveQty($ov['quantity'] ?? 1);
        $data = [
            'catalog_item_id' => $catalogItemId,
            'description'     => $ov['description'] ?? $ci['name'],
            'category_name'   => $ov['category_name'] ?? null,
            'quantity'        => $qty,
            'unit_measure'    => $ov['unit_measure'] ?? $ci['unit_measure'],
            'unit_price'      => (float) ($ov['unit_price'] ?? $price),
            'discount_value'  => $ov['discount_value'] ?? null,
            'discount_percent'=> $ov['discount_percent'] ?? null,
            'addition_value'  => $ov['addition_value'] ?? null,
            'addition_percent'=> $ov['addition_percent'] ?? null,
            'observation'     => $ov['observation'] ?? null,
        ];
        $r = $this->insertComputed($proposalId, $data);
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'item_added',
            'entity_type' => 'item', 'entity_id' => (int) ($r['item']['id'] ?? 0), 'new_value' => $data['description'] ?? '']);
        return $r;
    }

    public function addManual(array $koala, int $proposalId, array $d): array
    {
        $this->loadProposal($koala, $proposalId);
        if (trim((string) ($d['description'] ?? '')) === '') {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'description']);
        }
        self::requirePositiveQty($d['quantity'] ?? 1);
        $d['quantity'] = (float) ($d['quantity'] ?? 1);
        $d['unit_price'] = (float) ($d['unit_price'] ?? 0);
        $r = $this->insertComputed($proposalId, $d);
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'item_added',
            'entity_type' => 'item', 'entity_id' => (int) ($r['item']['id'] ?? 0), 'new_value' => $d['description'] ?? '']);
        return $r;
    }

    private function insertComputed(int $proposalId, array $data): array
    {
        self::validateLine($data);
        $c = PricingCalculationService::computeItem($data);
        $data['subtotal'] = $c['subtotal'];
        // A4: insert + recompute de totais atômicos.
        return KoalaTx::run($this->pdo, function () use ($proposalId, $data) {
            $data['display_order'] = $this->items->maxOrder($proposalId) + 1;
            $id = $this->items->insert($proposalId, $data);
            $totals = $this->recompute($proposalId);
            return ['item' => PricingCalculationService::withLineTotals($this->items->findById($id)), 'totals' => $totals];
        });
    }

    public function update(array $koala, int $proposalId, int $itemId, array $d): array
    {
        $this->loadProposal($koala, $proposalId);
        $item = $this->items->findById($itemId);
        if ($item === null || (int) $item['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['item_id' => $itemId]);
        }
        $merged = array_merge($item, $d);   // PUT parcial: só os campos enviados sobrescrevem
        self::validateLine($merged);
        $c = PricingCalculationService::computeItem($merged);
        $merged['subtotal'] = $c['subtotal'];
        // A4: update + recompute de totais atômicos.
        $r = KoalaTx::run($this->pdo, function () use ($proposalId, $itemId, $merged) {
            $this->items->update($itemId, $merged);
            $totals = $this->recompute($proposalId);
            return ['item' => PricingCalculationService::withLineTotals($this->items->findById($itemId)), 'totals' => $totals];
        });
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'item_updated',
            'entity_type' => 'item', 'entity_id' => $itemId, 'new_value' => $merged['description'] ?? '']);
        return $r;
    }

    public function remove(array $koala, int $proposalId, int $itemId): array
    {
        $this->loadProposal($koala, $proposalId);
        $item = $this->items->findById($itemId);
        if ($item === null || (int) $item['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['item_id' => $itemId]);
        }
        // A4: delete + recompute de totais atômicos.
        $r = KoalaTx::run($this->pdo, function () use ($itemId, $proposalId) {
            $this->items->delete($itemId);
            return ['removed' => $itemId, 'totals' => $this->recompute($proposalId)];
        });
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'item_removed',
            'entity_type' => 'item', 'entity_id' => $itemId, 'old_value' => $item['description'] ?? '']);
        return $r;
    }

    public function reorder(array $koala, int $proposalId, array $orderedIds): array
    {
        $this->loadProposal($koala, $proposalId);
        // A4: reordenação em transação (tudo ou nada).
        return KoalaTx::run($this->pdo, function () use ($orderedIds, $proposalId) {
            $order = 1;
            foreach ($orderedIds as $iid) {
                if (ctype_digit((string) $iid)) { $this->items->setOrder((int) $iid, $order++, $proposalId); }
            }
            return $this->items->listDraft($proposalId);
        });
    }
}
