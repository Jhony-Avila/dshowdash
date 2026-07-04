<?php
// /api/koala/services/ProposalPaymentTermService.php
// Formas de pagamento vinculadas à proposta. Auth via ProposalService::get.
// @module koala.service.proposal_payment_term @version 1.0.0
declare(strict_types=1);

class ProposalPaymentTermService
{
    private \PDO $pdo;
    private ProposalPaymentTermRepository $repo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
        $this->repo = new ProposalPaymentTermRepository($pdo);
    }

    public function list(array $koala, int $proposalId): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId);   // 404/403
        return $this->repo->listByProposal($proposalId);
    }

    public function add(array $koala, int $proposalId, array $d): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId);
        $pmId = (int) ($d['payment_method_id'] ?? 0);
        if ($pmId <= 0) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'payment_method_id']);
        }
        // valida existência/ativo da forma de pagamento no catálogo
        $ok = $this->pdo->prepare('SELECT 1 FROM koala_payment_methods WHERE id = ? AND is_active = 1 LIMIT 1');
        $ok->execute([$pmId]);
        if (!$ok->fetchColumn()) {
            ApiResponse::error(ApiResponse::ERR_VALIDATION_ERROR, 422, ['field' => 'payment_method_id', 'message' => 'Forma de pagamento inválida']);
        }
        $id = $this->repo->insert($proposalId, $d);
        return ['term' => $this->repo->findById($id), 'terms' => $this->repo->listByProposal($proposalId)];
    }

    public function remove(array $koala, int $proposalId, int $termId): array
    {
        (new ProposalService($this->pdo))->get($koala, $proposalId);
        $t = $this->repo->findById($termId);
        if ($t === null || (int) $t['proposal_id'] !== $proposalId) {
            ApiResponse::error(ApiResponse::ERR_NOT_FOUND, 404, ['term_id' => $termId]);
        }
        $this->repo->delete($termId);
        return ['removed' => $termId, 'terms' => $this->repo->listByProposal($proposalId)];
    }
}
