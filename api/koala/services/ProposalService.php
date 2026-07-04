<?php
// /api/koala/services/ProposalService.php
// Regras de proposta: criação (número atômico + rascunho), listagem por papel, autosave, status, soft-delete.
// Versão: rascunho = koala_proposals + koala_proposal_items (mutável). Versão CONGELADA só em marco (F3/F4).
// @module koala.service.proposal @version 1.0.0-F2
declare(strict_types=1);

class ProposalService
{
    private \PDO $pdo;
    private ProposalRepository $repo;

    public const STATUSES = ['draft','generated','sent','viewed','expired','won','lost','canceled','user_deleted'];

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repo = new ProposalRepository($pdo);
    }

    private function assertAccess(array $koala, array $proposal): void
    {
        if (PermissionService::canSeeAllProposals($koala)) { return; }         // gestor/admin
        if ((int) $proposal['seller_user_id'] !== (int) $koala['id']) {
            ApiResponse::error(ApiResponse::ERR_NOT_AUTHORIZED, 403, ['message' => 'Proposta de outro vendedor']);
        }
    }

    private function validCurrency(string $code): bool
    {
        $stmt = $this->pdo->prepare('SELECT 1 FROM koala_currencies WHERE code = ? AND is_active = 1 LIMIT 1');
        $stmt->execute([$code]);
        return (bool) $stmt->fetchColumn();
    }

    public function create(array $koala, array $data): array
    {
        $currency = strtoupper((string) ($data['currency'] ?? 'BRL'));
        if (!$this->validCurrency($currency)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'currency', 'message' => 'Moeda invalida']);
        }
        $owns = !$this->pdo->inTransaction();
        if ($owns) { $this->pdo->beginTransaction(); }
        try {
            $number = NumberingService::next($this->pdo);
            $id = $this->repo->insert([
                'proposal_number' => $number,
                'seller_user_id'  => (int) $koala['id'],
                // Snapshot do vendedor: default do usuário logado, editável na proposta depois.
                'seller_name'     => $koala['name'] ?? null,
                'seller_email'    => $koala['email'] ?? null,
                'seller_phone'    => $koala['phone'] ?? null,
                'currency'        => $currency,
                'status'          => 'draft',
                'title'           => $data['title'] ?? ('Proposta ' . $number),
                'project_name'    => $data['project_name'] ?? null,
                'proposal_date'   => date('Y-m-d'),
                'valid_until'     => date('Y-m-d', strtotime('+30 days')),
                'created_by'      => (int) $koala['id'],
            ]);
            if ($owns) { $this->pdo->commit(); }
        } catch (\Throwable $e) {
            if ($owns && $this->pdo->inTransaction()) { $this->pdo->rollBack(); }
            error_log('[koala] proposal create: ' . $e->getMessage());
            ApiResponse::error(ApiResponse::ERR_DATABASE_ERROR, 500);
        }
        return $this->repo->findById($id) ?? [];
    }

    public function list(array $koala, ?string $status): array
    {
        return $this->repo->listByRole(PermissionService::canSeeAllProposals($koala), (int) $koala['id'], $status);
    }

    public function get(array $koala, int $id): array
    {
        $p = $this->repo->findById($id);
        if ($p === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]); }
        $this->assertAccess($koala, $p);
        return $p;
    }

    public function update(array $koala, int $id, array $data): array
    {
        $p = $this->repo->findById($id);
        if ($p === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]); }
        $this->assertAccess($koala, $p);
        if (isset($data['currency'])) {
            $data['currency'] = strtoupper((string) $data['currency']);
            if (!$this->validCurrency($data['currency'])) {
                ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'currency']);
            }
        }
        $this->repo->updateFields($id, $data);
        // Campos que afetam o total_final -> recalcula (frete/instal/desloc legados + desconto da proposta).
        $recomputeKeys = ['freight_value', 'installation_value', 'displacement_value',
            'proposal_discount_value', 'proposal_discount_percent'];
        if (array_intersect(array_keys($data), $recomputeKeys)) {
            (new ProposalItemService($this->pdo))->recompute($id);
        }
        return $this->repo->findById($id) ?? [];
    }

    public function setStatus(array $koala, int $id, string $status): array
    {
        if (!in_array($status, self::STATUSES, true)) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'status', 'allowed' => self::STATUSES]);
        }
        $p = $this->repo->findById($id);
        if ($p === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]); }
        $this->assertAccess($koala, $p);
        $this->repo->setStatus($id, $status);
        return $this->repo->findById($id) ?? [];
    }

    public function deleteForUser(array $koala, int $id): void
    {
        $p = $this->repo->findById($id);
        if ($p === null) { ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['id' => $id]); }
        $this->assertAccess($koala, $p);
        $this->repo->markDeletedForSeller($id);
    }
}
