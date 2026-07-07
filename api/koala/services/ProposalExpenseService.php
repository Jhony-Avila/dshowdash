<?php
// /api/koala/services/ProposalExpenseService.php
// Despesas Operacionais dentro da proposta. Espelho de ProposalItemService (sem catálogo).
// Recálculo dos totais delegado ao ProposalItemService (fonte única).
// @module koala.service.proposal_expense @version 1.0.0
declare(strict_types=1);

class ProposalExpenseService
{
    private \PDO $pdo;
    private ProposalExpenseRepository $expenses;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->expenses = new ProposalExpenseRepository($pdo);
    }

    /** Carrega a proposta autorizada (404/403 dentro). */
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

    private function recompute(int $proposalId): array
    {
        return (new ProposalItemService($this->pdo))->recompute($proposalId);
    }

    public function list(array $koala, int $proposalId): array
    {
        $this->loadProposal($koala, $proposalId);
        return array_map([PricingCalculationService::class, 'withLineTotals'], $this->expenses->listDraft($proposalId));
    }

    public function add(array $koala, int $proposalId, array $d): array
    {
        $this->loadProposal($koala, $proposalId);
        $d['quantity']   = (float) ($d['quantity'] ?? 1);
        $d['unit_price'] = (float) ($d['unit_price'] ?? 0);
        $r = $this->insertComputed($proposalId, $d);
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'expense_added',
            'entity_type' => 'expense', 'entity_id' => (int) ($r['expense']['id'] ?? 0), 'new_value' => $d['description'] ?? '']);
        return $r;
    }

    private function insertComputed(int $proposalId, array $data): array
    {
        ProposalItemService::validateLine($data);   // mesma validação de linha (espelho)
        $c = PricingCalculationService::computeItem($data);
        $data['subtotal'] = $c['subtotal'];
        // A4: insert + recompute de totais atômicos.
        return KoalaTx::run($this->pdo, function () use ($proposalId, $data) {
            $data['display_order'] = $this->expenses->maxOrder($proposalId) + 1;
            $id = $this->expenses->insert($proposalId, $data);
            $totals = $this->recompute($proposalId);
            return ['expense' => PricingCalculationService::withLineTotals($this->expenses->findById($id)), 'totals' => $totals];
        });
    }

    public function update(array $koala, int $proposalId, int $expenseId, array $d): array
    {
        $this->loadProposal($koala, $proposalId);
        $exp = $this->expenses->findById($expenseId);
        if ($exp === null || (int) $exp['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['expense_id' => $expenseId]);
        }
        $merged = array_merge($exp, $d);   // PUT parcial
        ProposalItemService::validateLine($merged);
        $c = PricingCalculationService::computeItem($merged);
        $merged['subtotal'] = $c['subtotal'];
        // A4: update + recompute de totais atômicos.
        $r = KoalaTx::run($this->pdo, function () use ($proposalId, $expenseId, $merged) {
            $this->expenses->update($expenseId, $merged);
            $totals = $this->recompute($proposalId);
            return ['expense' => PricingCalculationService::withLineTotals($this->expenses->findById($expenseId)), 'totals' => $totals];
        });
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'expense_updated',
            'entity_type' => 'expense', 'entity_id' => $expenseId, 'new_value' => $merged['description'] ?? '']);
        return $r;
    }

    public function remove(array $koala, int $proposalId, int $expenseId): array
    {
        $this->loadProposal($koala, $proposalId);
        $exp = $this->expenses->findById($expenseId);
        if ($exp === null || (int) $exp['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['expense_id' => $expenseId]);
        }
        // A4: delete + recompute de totais atômicos.
        $r = KoalaTx::run($this->pdo, function () use ($expenseId, $proposalId) {
            $this->expenses->delete($expenseId);
            return ['removed' => $expenseId, 'totals' => $this->recompute($proposalId)];
        });
        (new LogService($this->pdo))->log($koala, ['proposal_id' => $proposalId, 'action' => 'expense_removed',
            'entity_type' => 'expense', 'entity_id' => $expenseId, 'old_value' => $exp['description'] ?? '']);
        return $r;
    }

    public function reorder(array $koala, int $proposalId, array $orderedIds): array
    {
        $this->loadProposal($koala, $proposalId);
        // A4: reordenação em transação (tudo ou nada).
        return KoalaTx::run($this->pdo, function () use ($orderedIds, $proposalId) {
            $order = 1;
            foreach ($orderedIds as $eid) {
                if (ctype_digit((string) $eid)) { $this->expenses->setOrder((int) $eid, $order++); }
            }
            return $this->expenses->listDraft($proposalId);
        });
    }
}
